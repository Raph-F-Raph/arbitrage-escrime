import { MatchConfig, Mode, ModeFormat, Settings, Weapon } from './types';

export const MODE_NAMES: Record<Mode, string> = {
  simple: 'Simple',
  pool: 'Poule',
  de: 'Élimination directe',
  equipes: 'Équipes',
};

// Libellés courts pour la barre d'onglets
export const MODE_SHORT: Record<Mode, string> = {
  simple: 'Simple',
  pool: 'Poule',
  de: 'Élim. directe',
  equipes: 'Équipes',
};

export const MODES: Mode[] = ['simple', 'pool', 'de', 'equipes'];

// Valeurs d'après le règlement technique FIE (août 2026)
export const MODE_DEFAULTS: Record<Mode, ModeFormat> = {
  simple: { target: 5, periods: 1, periodSec: 180, breakSec: 0 },
  pool: { target: 5, periods: 1, periodSec: 180, breakSec: 0 },
  de: { target: 15, periods: 3, periodSec: 180, breakSec: 60 },
  equipes: { target: 45, periods: 9, periodSec: 180, breakSec: 0 },
};

export const WEAPONS: Weapon[] = ['foil', 'epee', 'sabre', 'all'];

const cloneModes = (): Record<Mode, ModeFormat> => {
  const out = {} as Record<Mode, ModeFormat>;
  for (const m of MODES) out[m] = { ...MODE_DEFAULTS[m] };
  return out;
};

export const DEFAULT_SETTINGS: Settings = {
  weapon: 'foil',
  weaponModes: {
    foil: cloneModes(),
    epee: cloneModes(),
    sabre: cloneModes(),
    all: cloneModes(),
  },
  longPressMs: 600,
  timerScale: 1,
  theme: 'system',
  sound: true,
  vibration: true,
  keepAwake: true,
};

// Fusionne des réglages enregistrés (éventuellement d'une ancienne version) avec les valeurs par défaut
export function mergeSettings(saved: (Partial<Settings> & { modes?: Partial<Record<Mode, ModeFormat>> }) | null): Settings {
  const { modes: legacy, ...rest } = saved ?? {};
  const s = { ...DEFAULT_SETTINGS, ...rest };
  const weaponModes = {} as Record<Weapon, Record<Mode, ModeFormat>>;
  for (const w of WEAPONS) {
    const fmts = cloneModes();
    for (const m of MODES) {
      // ancienne version : un seul format pour toutes les armes → repris pour l'arme qui était choisie
      const old = w === s.weapon ? legacy?.[m] : undefined;
      fmts[m] = { ...fmts[m], ...(old ?? {}), ...(saved?.weaponModes?.[w]?.[m] ?? {}) };
    }
    weaponModes[w] = fmts;
  }
  return { ...s, weaponModes };
}

export function cfgForMode(s: Settings, mode: Mode): MatchConfig {
  const f = s.weaponModes[s.weapon][mode];
  const autoEnd = mode !== 'simple'; // le mode Simple n'a aucune limite de points
  const team = mode === 'equipes';
  return {
    autoEnd,
    target: f.target,
    periods: f.periods,
    periodMs: f.periodSec * 1000,
    breakMs: f.breakSec * 1000,
    weapon: s.weapon,
    team,
    // Sabre en élimination directe (plusieurs périodes, hors équipes) : pas de limite de temps
    noClock: autoEnd && s.weapon === 'sabre' && f.periods > 1 && !team,
  };
}
