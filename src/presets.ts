import { FormatPreset, MatchConfig, Settings } from './types';

// Valeurs d'après le règlement technique FIE (août 2026)
export const FORMATS: FormatPreset[] = [
  { id: 'poules', name: 'Poules', target: 5, periods: 1, periodSec: 180, breakSec: 0, team: false },
  { id: 'de', name: 'Élimination directe', target: 15, periods: 3, periodSec: 180, breakSec: 60, team: false },
  { id: 'veterans', name: 'Vétérans', target: 10, periods: 2, periodSec: 180, breakSec: 60, team: false },
  { id: 'equipes', name: 'Équipes', target: 45, periods: 9, periodSec: 180, breakSec: 0, team: true },
];

export const DEFAULT_SETTINGS: Settings = {
  weapon: 'foil',
  formatId: 'poules',
  target: 5,
  periods: 1,
  periodSec: 180,
  breakSec: 0,
  team: false,
  longPressMs: 600,
  timerScale: 1,
  theme: 'system',
  sound: true,
  vibration: true,
  keepAwake: true,
  customPresets: [],
};

export function cfgFromSettings(s: Settings, autoEnd: boolean): MatchConfig {
  return {
    autoEnd,
    target: s.target,
    periods: s.periods,
    periodMs: s.periodSec * 1000,
    breakMs: s.breakSec * 1000,
    weapon: s.weapon,
    team: s.team,
  };
}
