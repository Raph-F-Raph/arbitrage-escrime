import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { key, makeMatches, Pool, standings } from '../poolLogic';
import { confirmAction } from '../confirm';
import { Colors } from '../utils';

interface Props {
  pool: Pool | null;
  setPool: (p: Pool | null) => void;
  colors: Colors;
  onOpenMatch: (i: number, j: number) => void;
}

export default function PoolScreen({ pool, setPool, colors, onOpenMatch }: Props) {
  const [count, setCount] = useState(6);
  const [names, setNames] = useState<string[]>(Array.from({ length: 8 }, (_, i) => `Tireur ${i + 1}`));

  const create = () => {
    const list = names.slice(0, count).map((n, i) => n.trim() || `Tireur ${i + 1}`);
    setPool({ names: list, results: {} });
  };

  const newPool = () => {
    confirmAction('Nouvelle poule ?', 'La poule actuelle et ses résultats seront effacés.', 'Effacer', () => setPool(null));
  };

  if (!pool) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.pad}>
        <Text style={[styles.title, { color: colors.text }]}>Créer une poule</Text>
        <View style={styles.row}>
          <Text style={{ color: colors.text, fontSize: 16 }}>Nombre de tireurs : {count}</Text>
          <View style={styles.row}>
            <Pressable
              style={[styles.sq, { backgroundColor: colors.surface }]}
              onPress={() => setCount((c) => Math.max(3, c - 1))}
            >
              <Text style={{ color: colors.text, fontSize: 22 }}>−</Text>
            </Pressable>
            <Pressable
              style={[styles.sq, { backgroundColor: colors.surface }]}
              onPress={() => setCount((c) => Math.min(8, c + 1))}
            >
              <Text style={{ color: colors.text, fontSize: 22 }}>＋</Text>
            </Pressable>
          </View>
        </View>
        {names.slice(0, count).map((n, i) => (
          <TextInput
            key={i}
            value={n}
            onChangeText={(v) => setNames((old) => old.map((x, k) => (k === i ? v : x)))}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholderTextColor={colors.muted}
          />
        ))}
        <Pressable style={[styles.big, { backgroundColor: colors.accent }]} onPress={create}>
          <Text style={styles.bigText}>Créer la poule</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const matches = makeMatches(pool.names.length);
  const rows = standings(pool);
  const played = Object.keys(pool.results).length;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.pad}>
      <Text style={[styles.title, { color: colors.text }]}>
        Matchs ({played}/{matches.length})
      </Text>
      {matches.map(([i, j]) => {
        const r = pool.results[key(i, j)];
        return (
          <Pressable
            key={`${i}-${j}`}
            onPress={() => onOpenMatch(i, j)}
            style={[styles.match, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.left, flex: 1, fontWeight: '600' }} numberOfLines={1}>
              {pool.names[i]}
            </Text>
            <Text style={{ color: colors.text, fontWeight: '800', minWidth: 70, textAlign: 'center' }}>
              {r ? `${r.a} – ${r.b}` : 'à faire'}
            </Text>
            <Text style={{ color: colors.right, flex: 1, textAlign: 'right', fontWeight: '600' }} numberOfLines={1}>
              {pool.names[j]}
            </Text>
          </Pressable>
        );
      })}

      <Text style={[styles.title, { color: colors.text, marginTop: 20 }]}>Classement</Text>
      <View style={[styles.tr, { borderColor: colors.border }]}>
        {['#', 'Tireur', 'V', 'D', 'TD', 'TR', 'Ind'].map((h, k) => (
          <Text key={h} style={[k === 1 ? styles.tdName : styles.td, { color: colors.muted, fontWeight: '700' }]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r) => (
        <View key={r.index} style={[styles.tr, { borderColor: colors.border }]}>
          <Text style={[styles.td, { color: colors.text }]}>{r.rank}</Text>
          <Text style={[styles.tdName, { color: colors.text }]} numberOfLines={1}>
            {r.name}
          </Text>
          <Text style={[styles.td, { color: colors.text }]}>{r.v}</Text>
          <Text style={[styles.td, { color: colors.text }]}>{r.d}</Text>
          <Text style={[styles.td, { color: colors.text }]}>{r.td}</Text>
          <Text style={[styles.td, { color: colors.text }]}>{r.tr}</Text>
          <Text style={[styles.td, { color: colors.text }]}>{r.ind > 0 ? `+${r.ind}` : r.ind}</Text>
        </View>
      ))}
      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
        Classement : ratio victoires/matchs, puis indice (TD − TR), puis touches données.
      </Text>

      <Pressable style={[styles.big, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]} onPress={newPool}>
        <Text style={[styles.bigText, { color: colors.text }]}>Nouvelle poule</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 14, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  sq: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, fontSize: 16 },
  big: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  bigText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  match: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8, gap: 8 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  td: { width: 34, textAlign: 'center', fontVariant: ['tabular-nums'] },
  tdName: { flex: 1, paddingHorizontal: 4 },
});
