import { Card, CardType, MatchConfig, Side } from './types';

export type Phase = 'idle' | 'running' | 'paused' | 'break' | 'timeup' | 'tie' | 'ended';
export type AlertKind = 'period' | 'end' | 'passivity';

export const PASSIVITY_MS = 60000;
export const DECISIVE_MS = 60000;
export const RELAY_TOUCHES = 5;

export interface MatchState {
  cfg: MatchConfig;
  left: number;
  right: number;
  phase: Phase;
  period: number;
  remainingMs: number;
  passivityMs: number;
  cards: Record<Side, Card[]>;
  decisive: boolean; // la prochaine touche gagne (ex. épée à 4-4)
  decisiveMinute: boolean; // minute de touche décisive après égalité
  priority: Side | null;
  winner: Side | null;
  message: string | null;
  history: { left: number; right: number }[];
  alert: { id: number; kind: AlertKind } | null;
}

export type Action =
  | { type: 'CONFIG'; cfg: MatchConfig }
  | { type: 'RESET'; cfg: MatchConfig; left?: number; right?: number }
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'TICK'; dt: number }
  | { type: 'SCORE'; side: Side; delta: 1 | -1 }
  | { type: 'DOUBLE' }
  | { type: 'CARD'; side: Side; card: CardType }
  | { type: 'UNDO_CARD'; side: Side }
  | { type: 'UNDO_TOUCH' }
  | { type: 'SKIP_BREAK' }
  | { type: 'DRAW'; side: Side }
  | { type: 'START_DECISIVE'; side: Side };

const other = (s: Side): Side => (s === 'left' ? 'right' : 'left');

export function initialState(cfg: MatchConfig, left = 0, right = 0): MatchState {
  return {
    cfg,
    left,
    right,
    phase: 'idle',
    period: 0,
    remainingMs: cfg.periodMs,
    passivityMs: PASSIVITY_MS,
    cards: { left: [], right: [] },
    decisive: false,
    decisiveMinute: false,
    priority: null,
    winner: null,
    message: null,
    history: [],
    alert: null,
  };
}

function raise(s: MatchState, kind: AlertKind): MatchState {
  return { ...s, alert: { id: (s.alert?.id ?? 0) + 1, kind } };
}

function declare(s: MatchState, winner: Side, why: string): MatchState {
  return raise(
    { ...s, phase: 'ended', winner, decisive: false, decisiveMinute: false, message: why },
    'end'
  );
}

function finishByTime(s: MatchState): MatchState {
  if (!s.cfg.autoEnd) {
    return raise({ ...s, phase: 'timeup', remainingMs: 0, message: 'Temps écoulé' }, 'end');
  }
  if (s.left !== s.right) {
    return declare({ ...s, remainingMs: 0 }, s.left > s.right ? 'left' : 'right', 'Temps écoulé');
  }
  return raise(
    { ...s, phase: 'tie', remainingMs: 0, message: 'Égalité – touche décisive' },
    'end'
  );
}

function endPeriod(s: MatchState): MatchState {
  const { cfg } = s;
  if (s.period < cfg.periods - 1) {
    if (cfg.breakMs > 0) {
      return raise(
        { ...s, phase: 'break', remainingMs: cfg.breakMs, message: `Fin de la période ${s.period + 1}` },
        'period'
      );
    }
    return raise(
      {
        ...s,
        period: s.period + 1,
        phase: 'idle',
        remainingMs: cfg.periodMs,
        passivityMs: PASSIVITY_MS,
        message: `Période ${s.period + 2}`,
      },
      'period'
    );
  }
  return finishByTime(s);
}

function applyScore(s: MatchState, side: Side, delta: number, push: boolean): MatchState {
  const prev = { left: s.left, right: s.right };
  return {
    ...s,
    [side]: Math.max(0, s[side] + delta),
    history: push ? [...s.history.slice(-49), prev] : s.history,
    passivityMs: delta > 0 ? PASSIVITY_MS : s.passivityMs,
  } as MatchState;
}

function afterScore(s: MatchState, scorer: Side | null): MatchState {
  const { cfg } = s;
  if (!cfg.autoEnd) return s; // mode Simple : aucune limite de points

  if ((s.decisive || s.decisiveMinute) && scorer) {
    return declare(s, scorer, 'Touche décisive');
  }

  const max = Math.max(s.left, s.right);
  if (max >= cfg.target) {
    if (s.left === s.right) {
      return raise({ ...s, phase: 'tie', message: 'Égalité – touche décisive' }, 'end');
    }
    return declare(s, s.left > s.right ? 'left' : 'right', 'Score atteint');
  }

  if (cfg.weapon === 'epee' && cfg.target === 5 && s.left === 4 && s.right === 4 && !s.decisive) {
    return { ...s, decisive: true, message: 'Touche décisive à 4-4' };
  }

  if (cfg.team) {
    if (s.period < cfg.periods - 1 && max >= RELAY_TOUCHES * (s.period + 1)) return endPeriod(s);
  } else if (cfg.weapon === 'sabre' && cfg.periods > 1 && s.period === 0 && max >= Math.ceil(cfg.target / 2)) {
    return endPeriod(s);
  }
  return s;
}

function giveCard(s: MatchState, side: Side, card: CardType): MatchState {
  const opp = other(side);
  const list = [...s.cards[side]];
  let message: string | null = null;
  let gives = false;

  if (card === 'black') {
    list.push({ type: 'black', gavePoint: false });
  } else if (card === 'red') {
    list.push({ type: 'red', gavePoint: true });
    gives = true;
    message = 'Rouge : +1 pour l’adversaire';
  } else {
    const hasRed = list.some((c) => c.type === 'red');
    const yIdx = list.findIndex((c) => c.type === 'yellow');
    if (hasRed) {
      list.push({ type: 'red', gavePoint: true });
      gives = true;
      message = 'Jaune après rouge → Rouge : +1 pour l’adversaire';
    } else if (yIdx >= 0) {
      list.splice(yIdx, 1);
      list.push({ type: 'red', gavePoint: true, fromYellow: true });
      gives = true;
      message = '2e jaune → Rouge : +1 pour l’adversaire';
    } else {
      list.push({ type: 'yellow', gavePoint: false });
    }
  }

  let ns: MatchState = { ...s, cards: { ...s.cards, [side]: list }, message };
  if (gives) ns = afterScore(applyScore(ns, opp, 1, false), opp);
  return ns;
}

export function reducer(s: MatchState, a: Action): MatchState {
  switch (a.type) {
    case 'CONFIG': {
      const ns = { ...s, cfg: a.cfg };
      if (s.phase === 'idle' && s.period === 0 && !s.decisiveMinute) ns.remainingMs = a.cfg.periodMs;
      return ns;
    }
    case 'RESET':
      return initialState(a.cfg, a.left ?? 0, a.right ?? 0);

    case 'START':
      if (s.phase === 'idle' || s.phase === 'paused') {
        if (s.remainingMs <= 0) return s;
        return { ...s, phase: 'running', message: null };
      }
      return s;
    case 'STOP':
      return s.phase === 'running' ? { ...s, phase: 'paused' } : s;

    case 'SKIP_BREAK':
      if (s.phase !== 'break') return s;
      return {
        ...s,
        period: s.period + 1,
        phase: 'idle',
        remainingMs: s.cfg.periodMs,
        passivityMs: PASSIVITY_MS,
        message: `Période ${s.period + 2}`,
      };

    case 'TICK': {
      if (s.phase === 'running') {
        const rem = s.remainingMs - a.dt;
        const pas = s.passivityMs - a.dt;
        let ns: MatchState = { ...s, remainingMs: Math.max(rem, 0), passivityMs: Math.max(pas, 0) };
        if (s.passivityMs > 0 && pas <= 0) ns = raise(ns, 'passivity');
        if (rem <= 0) {
          ns =
            ns.decisiveMinute && ns.priority
              ? declare(ns, ns.priority, 'Temps écoulé – victoire à la priorité')
              : endPeriod(ns);
        }
        return ns;
      }
      if (s.phase === 'break') {
        const rem = s.remainingMs - a.dt;
        if (rem <= 0) {
          return raise(
            {
              ...s,
              period: s.period + 1,
              phase: 'idle',
              remainingMs: s.cfg.periodMs,
              passivityMs: PASSIVITY_MS,
              message: `Période ${s.period + 2}`,
            },
            'period'
          );
        }
        return { ...s, remainingMs: rem };
      }
      return s;
    }

    case 'SCORE': {
      if (s.phase === 'ended' || s.phase === 'tie') return s;
      if (a.delta < 0 && s[a.side] === 0) return s;
      const ns = applyScore({ ...s, message: null }, a.side, a.delta, true);
      return a.delta > 0 ? afterScore(ns, a.side) : ns;
    }

    case 'DOUBLE': {
      if (s.phase === 'ended' || s.phase === 'tie') return s;
      if (s.decisive || s.decisiveMinute) {
        return { ...s, message: 'Double non compté en touche décisive' };
      }
      const ns: MatchState = {
        ...s,
        left: s.left + 1,
        right: s.right + 1,
        history: [...s.history.slice(-49), { left: s.left, right: s.right }],
        passivityMs: PASSIVITY_MS,
        message: null,
      };
      return afterScore(ns, null);
    }

    case 'CARD':
      if (s.phase === 'ended' || s.phase === 'tie') return s;
      return giveCard(s, a.side, a.card);

    case 'UNDO_CARD': {
      const list = [...s.cards[a.side]];
      const card = list.pop();
      if (!card) return s;
      if (card.fromYellow) list.push({ type: 'yellow', gavePoint: false });
      const opp = other(a.side);
      let ns: MatchState = { ...s, cards: { ...s.cards, [a.side]: list }, message: null };
      if (card.gavePoint) ns = { ...ns, [opp]: Math.max(0, ns[opp] - 1) } as MatchState;
      if (ns.phase === 'ended' || ns.phase === 'tie') {
        ns = { ...ns, phase: ns.remainingMs > 0 ? 'paused' : 'idle', winner: null, decisive: false };
      }
      return ns;
    }

    case 'UNDO_TOUCH': {
      const prev = s.history[s.history.length - 1];
      if (!prev) return s;
      let ns: MatchState = {
        ...s,
        left: prev.left,
        right: prev.right,
        history: s.history.slice(0, -1),
        winner: null,
        message: null,
        decisive: false,
      };
      if (s.phase === 'ended' || s.phase === 'tie') {
        ns = ns.remainingMs > 0 ? { ...ns, phase: 'paused' } : finishByTime(ns);
      }
      return ns;
    }

    case 'DRAW':
      return { ...s, priority: a.side };

    case 'START_DECISIVE':
      if (s.phase !== 'tie') return s;
      return {
        ...s,
        phase: 'idle',
        decisiveMinute: true,
        priority: a.side,
        remainingMs: DECISIVE_MS,
        passivityMs: PASSIVITY_MS,
        message: 'Touche décisive – 1:00',
      };

    default:
      return s;
  }
}
