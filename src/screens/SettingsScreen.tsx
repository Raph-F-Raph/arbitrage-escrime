import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { FORMATS } from '../presets';
import { FormatPreset, Settings, Weapon } from '../types';
import { Colors, formatMinSec } from '../utils';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onBack: () => void;
  colors: Colors;
}

const WEAPONS: { id: Weapon; label: string }[] = [
  { id: 'foil', label: 'Fleuret' },
  { id: 'epee', label: 'Épée' },
  { id: 'sabre', label: 'Sabre' },
];

export default function SettingsScreen({ settings, onChange, onBack, colors }: Props) {
  const [presetName, setPresetName] = useState('');

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
  const setFormat = (patch: Partial<Settings>) => onChange({ ...settings, ...patch, formatId: 'custom' });

  const applyPreset = (p: FormatPreset) =>
    onChange({
      ...settings,
      formatId: p.id,
      target: p.target,
      periods: p.periods,
      periodSec: p.periodSec,
      breakSec: p.breakSec,
      team: p.team,
    });

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const p: FormatPreset = {
      id: `c${Date.now()}`,
      name,
      target: settings.target,
      periods: settings.periods,
      periodSec: settings.periodSec,
      breakSec: settings.breakSec,
      team: settings.team,
    };
    onChange({ ...settings, customPresets: [...settings.customPresets, p], formatId: p.id });
    setPresetName('');
  };

  const deletePreset = (id: string) =>
    onChange({
      ...settings,
      customPresets: settings.customPresets.filter((p) => p.id !== id),
      formatId: settings.formatId === id ? 'custom' : settings.formatId,
    });

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
          Épée en poules : à 4-4, touche décisive. Sabre en élimination directe : la 1re période s'arrête à 8 touches (5 en vétérans).
        </Text>

        {section('FORMAT DE MATCH')}
        <View style={styles.chips}>
          {[...FORMATS, ...settings.customPresets].map((p) => (
            <Chip key={p.id} label={p.name} active={settings.formatId === p.id} onPress={() => applyPreset(p)} />
          ))}
        </View>
        <Stepper
          label="Durée d'une période"
          display={formatMinSec(settings.periodSec)}
          onMinus={() => setFormat({ periodSec: clamp(settings.periodSec - 15, 15, 600) })}
          onPlus={() => setFormat({ periodSec: clamp(settings.periodSec + 15, 15, 600) })}
        />
        <Stepper
          label="Nombre de périodes"
          display={`${settings.periods}`}
          onMinus={() => setFormat({ periods: clamp(settings.periods - 1, 1, 9) })}
          onPlus={() => setFormat({ periods: clamp(settings.periods + 1, 1, 9) })}
        />
        <Stepper
          label="Pause entre périodes"
          display={formatMinSec(settings.breakSec)}
          onMinus={() => setFormat({ breakSec: clamp(settings.breakSec - 15, 0, 300) })}
          onPlus={() => setFormat({ breakSec: clamp(settings.breakSec + 15, 0, 300) })}
        />
        <Stepper
          label="Score cible"
          display={`${settings.target}`}
          onMinus={() => setFormat({ target: clamp(settings.target - 1, 1, 45) })}
          onPlus={() => setFormat({ target: clamp(settings.target + 1, 1, 45) })}
        />
        <Text style={[styles.note, { color: colors.muted }]}>
          Le score cible et la fin automatique ne s'appliquent qu'en mode Poule. Le mode Simple n'a aucune limite de points.
        </Text>

        <Text style={{ color: colors.text, marginTop: 12, fontWeight: '700' }}>Enregistrer comme préréglage</Text>
        <View style={[styles.row, { marginTop: 6 }]}>
          <TextInput
            value={presetName}
            onChangeText={setPresetName}
            placeholder="Nom du préréglage"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          />
          <Pressable style={[styles.save, { backgroundColor: colors.accent }]} onPress={savePreset}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Enregistrer</Text>
          </Pressable>
        </View>
        {settings.customPresets.map((p) => (
          <View key={p.id} style={styles.row}>
            <Text style={{ color: colors.text, flex: 1 }}>{p.name}</Text>
            <Pressable onPress={() => deletePreset(p.id)}>
              <Text style={{ color: colors.left }}>Supprimer</Text>
            </Pressable>
          </View>
        ))}

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
