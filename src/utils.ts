import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer } from 'expo-audio';

export function formatTime(ms: number) {
  const t = Math.max(0, ms);
  const totalS = Math.floor(t / 1000);
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  const cs = Math.floor((t % 1000) / 10);
  return {
    main: `${m}:${s.toString().padStart(2, '0')}`,
    cs: `.${cs.toString().padStart(2, '0')}`,
  };
}

export function formatMinSec(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Stockage local (fonctionne sans internet)
export async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveJSON(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // on ignore : l'app continue de fonctionner
  }
}

// Son embarqué dans l'app (assets/beep.wav), aucun chargement depuis internet
let player: ReturnType<typeof createAudioPlayer> | null = null;
export function playBeep() {
  try {
    if (!player) player = createAudioPlayer(require('../assets/beep.wav'));
    player.seekTo(0);
    player.play();
  } catch {
    // pas de son : la vibration reste active
  }
}

export interface Colors {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  left: string;
  right: string;
  accent: string;
}

export function getColors(dark: boolean): Colors {
  return dark
    ? { bg: '#000000', surface: '#1b1b1f', text: '#ffffff', muted: '#9a9aa0', border: '#34343a', left: '#ef5350', right: '#66bb6a', accent: '#5c6bc0' }
    : { bg: '#ffffff', surface: '#f0f0f4', text: '#111111', muted: '#6b6b73', border: '#d0d0d8', left: '#d32f2f', right: '#2e7d32', accent: '#3f51b5' };
}
