import React, { useEffect, useReducer, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { initialState, reducer } from '../matchLogic';
import { CardType, MatchConfig, Settings, Side } from '../types';
import { Colors, formatMinSec, formatTime, playBeep } from '../utils';

interface Props {
  cfg: MatchConfig;
  settings: Settings;
  colors: Colors;
  leftName?: string;
  rightName?: string;
  initialScores?: { left: number; right: number };
  poolMode?: boolean;
  onValidate?: (left: number, right: number) => void;
}

const CARD_COLORS: Record<CardType, string> = {
  yellow: '#fdd835',
  red: '#e53935',
  black: '#212121',
};

export default function MatchScreen(p: Props) {
  const { cfg, settings, colors } = p;
  const [s, dispatch] = useReducer(reducer, undefined, () =>
    initialState(cfg, p.initialScores?.left ?? 0, p.initialScores?.right ?? 0)
  );
  const [shownCard, setShownCard] = useState<CardType | null>(null);
  const [dice, setDice] = useState<string | null>(null);

  const leftName = p.leftName ?? 'Gauche';
  const rightName = p.rightName ?? 'Droite';
  const nameOf = (side: Side) => (side === 'left' ? leftName : rightName);

  // Met à jour la configuration quand les réglages changent
  const cfgKey = JSON.stringify(cfg);
  useEffect(() => {
    dispatch({ type: 'CONFIG', cfg });
  }, [cfgKey]);

  // Chrono (précision au centième)
  useEffect(() => {
    if (s.phase !== 'running' && s.phase !== 'break') return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      dispatch({ type: 'TICK', dt: now - last });
      last = now;
    }, 50);
    return () => clearInterval(id);
  }, [s.phase]);

  // Son + vibration (fin de période, fin de match, passivité)
  const alertId = s.alert?.id;
  useEffect(() => {
    if (!s.alert) return;
    const kind = s.alert.kind;
    if (settings.vibration) {
      Vibration.vibrate(kind === 'passivity' ? [0, 200, 100, 200] : [0, 400, 150, 400]);
    }
    if (settings.sound) playBeep();
  }, [alertId]);

  const running = s.phase === 'running';
  const t = formatTime(s.remainingMs);
  const fontMain = 96 * settings.timerScale;

  const onTimerPress = () => {
    if (s.phase === 'idle' || s.phase === 'paused') dispatch({ type: 'START' });
    else if (s.phase === 'break') dispatch({ type: 'SKIP_BREAK' });
  };
  const onTimerLong = () => {
    if (running) dispatch({ type: 'STOP' });
  };

  const onReset = () => {
    Alert.alert('Remettre à zéro ?', 'Les scores, le chrono et les cartons seront effacés.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Remettre à zéro',
        style: 'destructive',
        onPress: () => dispatch({ type: 'RESET', cfg, left: 0, right: 0 }),
      },
    ]);
  };

  const onDice = () => {
    let n = 0;
    const id = setInterval(() => {
      n++;
      setDice(n % 2 ? leftName : rightName);
      if (n >= 12) {
        clearInterval(id);
        const side: Side = Math.random() < 0.5 ? 'left' : 'right';
        dispatch({ type: 'DRAW', side });
        setDice(nameOf(side));
        setTimeout(() => setDice(null), 3000);
      }
    }, 80);
  };

  const onTieDraw = () => {
    const side: Side = Math.random() < 0.5 ? 'left' : 'right';
    dispatch({ type: 'START_DECISIVE', side });
  };

  const renderSide = (side: Side) => {
    const score = side === 'left' ? s.left : s.right;
    const color = side === 'left' ? colors.left : colors.right;
    const cards = s.cards[side];
    return (
      <View style={styles.side}>
        <Text style={[styles.name, { color: colors.muted }]} numberOfLines={1}>
          {nameOf(side)}
        </Text>
        <Pressable style={styles.arrowBtn} onPress={() => dispatch({ type: 'SCORE', side, delta: 1 })}>
          <Text style={[styles.arrow, { color: colors.text }]}>＋</Text>
        </Pressable>
        <Text style={[styles.score, { color }]}>{score}</Text>
        <Pressable style={styles.arrowBtn} onPress={() => dispatch({ type: 'SCORE', side, delta: -1 })}>
          <Text style={[styles.arrow, { color: colors.muted }]}>−</Text>
        </Pressable>

        <View style={styles.cardRow}>
          {(['yellow', 'red', 'black'] as CardType[]).map((c) => (
            <Pressable
              key={c}
              onPress={() => dispatch({ type: 'CARD', side, card: c })}
              style={[styles.cardBtn, { backgroundColor: CARD_COLORS[c], borderColor: colors.border }]}
            />
          ))}
        </View>
        <View style={styles.history}>
          {cards.map((c, i) => (
            <Pressable key={i} onPress={() => setShownCard(c.type)}>
              <View style={[styles.cardMini, { backgroundColor: CARD_COLORS[c.type], borderColor: colors.border }]} />
            </Pressable>
          ))}
        </View>
        {cards.length > 0 && (
          <Pressable onPress={() => dispatch({ type: 'UNDO_CARD', side })}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>↶ annuler carton</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const winnerName = s.winner ? nameOf(s.winner) : '';

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
          {s.cfg.periods > 1 ? `${s.cfg.team ? 'R' : 'P'}${s.period + 1}/${s.cfg.periods}` : 'P1'}
        </Text>
        {s.decisive || s.decisiveMinute ? (
          <Text style={{ color: colors.accent, fontWeight: '700' }}>TOUCHE DÉCISIVE</Text>
        ) : null}
        {s.priority ? (
          <Text style={{ color: colors.muted }}>Priorité : {nameOf(s.priority)}</Text>
        ) : null}
      </View>

      <View style={styles.scoreRow}>
        {renderSide('left')}
        <View style={styles.center}>
          <Pressable
            style={[styles.centerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => dispatch({ type: 'DOUBLE' })}
          >
            <Text style={{ color: colors.text, fontWeight: '800' }}>DOUBLE</Text>
          </Pressable>
          <Pressable
            style={[styles.centerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onDice}
          >
            <Text style={{ color: colors.text, fontSize: 22 }}>🎲</Text>
          </Pressable>
          <Pressable
            style={[styles.centerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => dispatch({ type: 'UNDO_TOUCH' })}
          >
            <Text style={{ color: colors.text, fontSize: 12 }}>↶ touche</Text>
          </Pressable>
          <Pressable
            style={[styles.centerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onReset}
          >
            <Text style={{ color: colors.text, fontSize: 20 }}>⟲</Text>
          </Pressable>
        </View>
        {renderSide('right')}
      </View>

      <Pressable
        style={styles.timerBox}
        onPress={onTimerPress}
        onLongPress={onTimerLong}
        delayLongPress={settings.longPressMs}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text style={{ color: colors.text, fontSize: fontMain, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            {t.main}
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: fontMain * 0.42,
              fontWeight: '800',
              marginBottom: fontMain * 0.12,
              fontVariant: ['tabular-nums'],
            }}
          >
            {t.cs}
          </Text>
        </View>
        <Text style={{ color: s.passivityMs <= 0 ? colors.left : colors.text, fontSize: 28, fontWeight: '700' }}>
          {formatMinSec(Math.ceil(s.passivityMs / 1000))}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6, textAlign: 'center' }}>
          {s.message ??
            (s.phase === 'break'
              ? 'Pause – toucher pour passer'
              : running
              ? 'Maintenir pour arrêter'
              : 'Toucher pour démarrer')}
        </Text>
      </Pressable>

      {/* Dé */}
      <Modal visible={dice !== null} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.muted }}>Tirage au sort</Text>
            <Text style={{ color: colors.text, fontSize: 36, fontWeight: '800', marginTop: 8 }}>{dice}</Text>
          </View>
        </View>
      </Modal>

      {/* Carton en plein écran */}
      <Modal visible={shownCard !== null} animationType="fade" onRequestClose={() => setShownCard(null)}>
        <Pressable
          style={[styles.fullCard, { backgroundColor: shownCard ? CARD_COLORS[shownCard] : '#000' }]}
          onPress={() => setShownCard(null)}
        >
          <Text style={{ color: shownCard === 'yellow' ? '#000' : '#fff', fontSize: 16 }}>Toucher pour fermer</Text>
        </Pressable>
      </Modal>

      {/* Fin de match (mode Poule) */}
      <Modal visible={!!p.poolMode && (s.phase === 'ended' || s.phase === 'tie')} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
            {s.phase === 'ended' ? (
              <>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
                  Match terminé – Victoire de {winnerName}
                </Text>
                <Text style={{ color: colors.text, fontSize: 40, fontWeight: '800', marginVertical: 12 }}>
                  {s.left} – {s.right}
                </Text>
                <Pressable
                  style={[styles.dialogBtn, { backgroundColor: colors.accent }]}
                  onPress={() => p.onValidate?.(s.left, s.right)}
                >
                  <Text style={styles.dialogBtnText}>Valider</Text>
                </Pressable>
                <Pressable
                  style={[styles.dialogBtn, { backgroundColor: colors.border }]}
                  onPress={() => dispatch({ type: 'UNDO_TOUCH' })}
                >
                  <Text style={[styles.dialogBtnText, { color: colors.text }]}>Annuler la dernière touche</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
                  Égalité {s.left} – {s.right}
                </Text>
                <Text style={{ color: colors.muted, marginVertical: 10, textAlign: 'center' }}>
                  Touche décisive de 1:00 après tirage au sort
                </Text>
                <Pressable style={[styles.dialogBtn, { backgroundColor: colors.accent }]} onPress={onTieDraw}>
                  <Text style={styles.dialogBtnText}>Tirer au sort et lancer 1:00</Text>
                </Pressable>
                <Pressable
                  style={[styles.dialogBtn, { backgroundColor: colors.border }]}
                  onPress={() => dispatch({ type: 'UNDO_TOUCH' })}
                >
                  <Text style={[styles.dialogBtnText, { color: colors.text }]}>Annuler la dernière touche</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, minHeight: 36 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  side: { flex: 1, alignItems: 'center' },
  center: { width: 84, alignItems: 'center', justifyContent: 'center', gap: 8 },
  name: { fontSize: 14, marginBottom: 2 },
  arrowBtn: { paddingHorizontal: 28, paddingVertical: 4 },
  arrow: { fontSize: 34, fontWeight: '700' },
  score: { fontSize: 110, fontWeight: '800', lineHeight: 120, fontVariant: ['tabular-nums'] },
  cardRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  cardBtn: { width: 30, height: 42, borderRadius: 4, borderWidth: 1 },
  history: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginVertical: 6, minHeight: 28, justifyContent: 'center' },
  cardMini: { width: 18, height: 26, borderRadius: 3, borderWidth: 1 },
  centerBtn: { width: 76, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', borderRadius: 16, padding: 24, alignItems: 'center' },
  dialogBtn: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  dialogBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  fullCard: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 60 },
});
