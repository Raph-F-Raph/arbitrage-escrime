import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { MODE_DEFAULTS, MODE_NAMES, MODES } from '../presets';
import { Mode, ModeFormat, Settings, Weapon } from '../types';
import { Colors, formatMinSec } from '../utils';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onBack: () => void;
  colors: Colors;
  mode: Mode; // mode affiché à l'ouverture des réglages
}

const WEAPONS: { id: Weapon; label: string }[] = [
  { id: 'foil', label: 'Fleuret' },
  { id: 'epee', label: 'Épée' },
  { id: 'sabre', label: 'Sabre' },
  { id: 'all', label: 'Toutes' },
];

export default function SettingsScreen({ settings, onChange, onBack, colors, mode }: Props) {
  const [editMode, setEditMode] = useState<Mode>(mode);
  const q = settings.modes[editMode];

  const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent : colors.surface },
      ]}
    >
      <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );

  const Stepper = ({
    label,
    display,
    onMinus,
    onPlus,
  }: {
    label: string;
    display: string;
    onMinus: () => void;
    onPlus: () => void;
  }) => (
    <View style={styles.row}>
      <Text style={{ color: colors.text, flex: 1, fontSize: 16 }}>{label}</Text>
      <Pressable style={[styles.sq, { backgroundColor: colors.surface }]} onPress={onMinus}>
        <Text style={{ color: colors.text, fontSize: 22 }}>−</Text>
      </Pressable>
      <Text style={{ color: colors.text, minWidth: 64, textAlign: 'center', fontWeight: '700', fontSize: 16 }}>
        {display}
      </Text>
      <Pressable style={[styles.sq, { backgroundColor: colors.surface }]} onPress={onPlus}>
        <Text style={{ color: colors.text, fontSize: 22 }}>＋</Text>
      </Pressable>
    </View>
  );

  const Toggle = ({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) => (
    <View style={styles.row}>
      <Text style={{ color: colors.text, flex: 1, fontSize: 16 }}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );

  const section = (t: string) => <Text style={[styles.section, { color: colors.muted }]}>{t}</Text>;

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const setFormat = (patch: Partial<ModeFormat>) =>
    onChange({ ...settings, modes: { ...settings.modes, [editMode]: { ...q, ...patch } } });
  const resetFormat = () =>
    onChange({ ...settings, modes: { ...settings.modes, [editMode]: { ...MODE_DEFAULTS[editMode] } } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={{ padding: 8 }}>
          <Text style={{ color: colors.text, fontSize: 18 }}>‹ Retour</Text>
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Réglages</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {section('ARME')}
        <View style={styles.chips}>
          {WEAPONS.map((w) => (
            <Chip key={w.id} label={w.label} active={settings.weapon === w.id} onPress={() => onChange({ ...settings, weapon: w.id })} />
          ))}
        </View>
        <Text style={[styles.note, { color: colors.muted }]}>
          {settings.weapon === 'all'
            ? 'Toutes : règles générales, sans règle propre à une arme (ni touche décisive à 4-4, ni pause à 8 touches).'
            : "Épée en poules : à 4-4, touche décisive. Sabre en élimination directe : pas de limite de temps, le chrono affiche 1:00 comme la passivité et la pause démarre dès qu'un tireur atteint 8 touches."}
        </Text>

        {section('FORMAT DU MODE')}
        <View style={styles.chips}>
          {MODES.map((m) => (
            <Chip key={m} label={MODE_NAMES[m]} active={editMode === m} onPress={() => setEditMode(m)} />
          ))}
        </View>
        <Stepper
          label="Durée d'une période"
          display={formatMinSec(q.periodSec)}
          onMinus={() => setFormat({ periodSec: clamp(q.periodSec - 15, 15, 600) })}
          onPlus={() => setFormat({ periodSec: clamp(q.periodSec + 15, 15, 600) })}
        />
        <Stepper
          label="Nombre de périodes"
          display={`${q.periods}`}
          onMinus={() => setFormat({ periods: clamp(q.periods - 1, 1, 9) })}
          onPlus={() => setFormat({ periods: clamp(q.periods + 1, 1, 9) })}
        />
        <Stepper
          label="Pause entre périodes"
          display={formatMinSec(q.breakSec)}
          onMinus={() => setFormat({ breakSec: clamp(q.breakSec - 15, 0, 300) })}
          onPlus={() => setFormat({ breakSec: clamp(q.breakSec + 15, 0, 300) })}
        />
        {editMode !== 'simple' && (
          <Stepper
            label="Score cible"
            display={`${q.target}`}
            onMinus={() => setFormat({ target: clamp(q.target - 1, 1, 45) })}
            onPlus={() => setFormat({ target: clamp(q.target + 1, 1, 45) })}
          />
        )}
        <Text style={[styles.note, { color: colors.muted }]}>
          {editMode === 'simple'
            ? "Le mode Simple n'a aucune limite de points."
            : 'Fin automatique du match quand un tireur atteint le score cible.'}
          {editMode === 'equipes' ? ' Un relais = 5 touches cumulées.' : ''}
        </Text>
        <Chip label="Valeurs FIE par défaut" active={false} onPress={resetFormat} />

        {section('SÉCURITÉ DU CHRONO')}
        <Stepper
          label="Appui long pour arrêter"
          display={`${(settings.longPressMs / 1000).toFixed(1)} s`}
          onMinus={() => onChange({ ...settings, longPressMs: clamp(settings.longPressMs - 100, 300, 1500) })}
          onPlus={() => onChange({ ...settings, longPressMs: clamp(settings.longPressMs + 100, 300, 1500) })}
        />
        <Stepper
          label="Taille du chrono"
          display={`${Math.round(settings.timerScale * 100)} %`}
          onMinus={() => onChange({ ...settings, timerScale: clamp(Math.round((settings.timerScale - 0.1) * 10) / 10, 0.6, 1.2) })}
          onPlus={() => onChange({ ...settings, timerScale: clamp(Math.round((settings.timerScale + 0.1) * 10) / 10, 0.6, 1.2) })}
        />

        {section('AFFICHAGE ET SON')}
        <View style={styles.chips}>
          {(['system', 'light', 'dark'] as const).map((t) => (
            <Chip
              key={t}
              label={t === 'system' ? 'Système' : t === 'light' ? 'Clair' : 'Sombre'}
              active={settings.theme === t}
              onPress={() => onChange({ ...settings, theme: t })}
            />
          ))}
        </View>
        <Toggle label="Sons" value={settings.sound} onValueChange={(v) => onChange({ ...settings, sound: v })} />
        <Toggle label="Vibrations" value={settings.vibration} onValueChange={(v) => onChange({ ...settings, vibration: v })} />
        <Toggle label="Écran toujours allumé" value={settings.keepAwake} onValueChange={(v) => onChange({ ...settings, keepAwake: v })} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 8 },
  section: { marginTop: 22, marginBottom: 8, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  sq: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 12, marginTop: 4, marginBottom: 6 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  save: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
});
