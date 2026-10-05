import { MatchConfig, Mode, ModeFormat, Settings } from './types';

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

export const DEFAULT_SETTINGS: Settings = {
  weapon: 'foil',
  modes: MODE_DEFAULTS,
  longPressMs: 600,
  timerScale: 1,
  theme: 'system',
  sound: true,
  vibration: true,
  keepAwake: true,
};

// Fusionne des réglages enregistrés (éventuellement d'une ancienne version) avec les valeurs par défaut
export function mergeSettings(saved: Partial<Settings> | null): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
  const modes = {} as Record<Mode, ModeFormat>;
  for (const m of MODES) modes[m] = { ...MODE_DEFAULTS[m], ...(saved?.modes?.[m] ?? {}) };
  return { ...s, modes };
}

export function cfgForMode(s: Settings, mode: Mode): MatchConfig {
  const f = s.modes[mode];
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
