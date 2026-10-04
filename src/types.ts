export type Weapon = 'foil' | 'epee' | 'sabre';
export type Side = 'left' | 'right';
export type CardType = 'yellow' | 'red' | 'black';

export interface Card {
  type: CardType;
  gavePoint: boolean; // un rouge a donné 1 touche à l'adversaire
  fromYellow?: boolean; // ce rouge vient de la conversion d'un 2e jaune
}

export interface MatchConfig {
  autoEnd: boolean; // fin automatique (mode Poule) ; false = mode Simple, sans limite de points
  target: number;
  periods: number;
  periodMs: number;
  breakMs: number;
  weapon: Weapon;
  team: boolean;
  noClock?: boolean; // sabre en élimination directe : pas de limite de temps (le chrono compte vers le haut)
}

export interface FormatPreset {
  id: string;
  name: string;
  target: number;
  periods: number;
  periodSec: number;
  breakSec: number;
  team: boolean;
}

export interface Settings {
  weapon: Weapon;
  formatId: string;
  target: number;
  periods: number;
  periodSec: number;
  breakSec: number;
  team: boolean;
  longPressMs: number;
  timerScale: number;
  theme: 'system' | 'light' | 'dark';
  sound: boolean;
  vibration: boolean;
  keepAwake: boolean;
  customPresets: FormatPreset[];
}
