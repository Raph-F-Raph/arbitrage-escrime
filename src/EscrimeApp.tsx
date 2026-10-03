import React, { useEffect, useState } from 'react';
import { Pressable, StatusBar, Text, useColorScheme, View } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import MatchScreen from './screens/MatchScreen';
import PoolScreen from './screens/PoolScreen';
import SettingsScreen from './screens/SettingsScreen';
import { cfgFromSettings, DEFAULT_SETTINGS } from './presets';
import { key, Pool } from './poolLogic';
import { Settings } from './types';
import { getColors, loadJSON, saveJSON } from './utils';

type Mode = 'simple' | 'pool';
const K_SETTINGS = 'escrime_settings_v1';
const K_POOL = 'escrime_pool_v1';
const K_MODE = 'escrime_mode_v1';

export default function EscrimeApp() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [pool, setPool] = useState<Pool | null>(null);
  const [mode, setMode] = useState<Mode>('simple');
  const [loaded, setLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [poolMatch, setPoolMatch] = useState<{ i: number; j: number } | null>(null);
  const system = useColorScheme();

  useEffect(() => {
    (async () => {
      const s = await loadJSON<Settings>(K_SETTINGS);
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...s });
      const p = await loadJSON<Pool>(K_POOL);
      if (p) setPool(p);
      const m = await loadJSON<Mode>(K_MODE);
      if (m) setMode(m);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) saveJSON(K_SETTINGS, settings);
  }, [settings, loaded]);
  useEffect(() => {
    if (loaded) saveJSON(K_POOL, pool);
  }, [pool, loaded]);
  useEffect(() => {
    if (loaded) saveJSON(K_MODE, mode);
  }, [mode, loaded]);

  useEffect(() => {
    try {
      if (settings.keepAwake) activateKeepAwakeAsync('escrime');
      else deactivateKeepAwake('escrime');
    } catch {
      // sans importance
    }
  }, [settings.keepAwake]);

  const dark = settings.theme === 'system' ? system !== 'light' : settings.theme === 'dark';
  const colors = getColors(dark);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const topPad = (StatusBar.currentHeight ?? 36) + 4;
  const simpleCfg = cfgFromSettings(settings, false); // mode Simple : aucune limite de points
  const poolCfg = cfgFromSettings(settings, true);

  const validate = (l: number, r: number) => {
    if (!poolMatch || !pool) return;
    const { i, j } = poolMatch;
    // le tireur de gauche est celui d'indice i
    setPool({ ...pool, results: { ...pool.results, [key(i, j)]: { a: l, b: r } } });
    setPoolMatch(null);
  };

  const existing = poolMatch && pool ? pool.results[key(poolMatch.i, poolMatch.j)] : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: topPad }}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />

      <View style={{ flex: 1, display: showSettings ? 'none' : 'flex' }}>
        {/* Barre du haut */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 6, gap: 8 }}>
          {poolMatch ? (
            <Pressable onPress={() => setPoolMatch(null)} style={{ padding: 8 }}>
              <Text style={{ color: colors.text, fontSize: 16 }}>‹ Poule</Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 3 }}>
              {(['simple', 'pool'] as Mode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: mode === m ? colors.accent : 'transparent',
                  }}
                >
                  <Text style={{ color: mode === m ? '#fff' : colors.text, fontWeight: '700' }}>
                    {m === 'simple' ? 'Simple' : 'Poule'}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={{ flex: poolMatch ? 1 : 0 }} />
          <Pressable onPress={() => setShowSettings(true)} style={{ padding: 8 }}>
            <Text style={{ color: colors.text, fontSize: 22 }}>⚙</Text>
          </Pressable>
        </View>

        {/* Mode Simple : reste en mémoire quand on change de mode */}
        <View style={{ flex: 1, display: mode === 'simple' ? 'flex' : 'none' }}>
          <MatchScreen cfg={simpleCfg} settings={settings} colors={colors} />
        </View>

        {/* Mode Poule */}
        <View style={{ flex: 1, display: mode === 'pool' ? 'flex' : 'none' }}>
          {poolMatch && pool ? (
            <MatchScreen
              key={`${poolMatch.i}-${poolMatch.j}`}
              cfg={poolCfg}
              settings={settings}
              colors={colors}
              poolMode
              leftName={pool.names[poolMatch.i]}
              rightName={pool.names[poolMatch.j]}
              initialScores={existing ? { left: existing.a, right: existing.b } : undefined}
              onValidate={validate}
            />
          ) : (
            <PoolScreen
              pool={pool}
              setPool={setPool}
              colors={colors}
              onOpenMatch={(i, j) => setPoolMatch({ i, j })}
            />
          )}
        </View>
      </View>

      {showSettings && (
        <View style={{ position: 'absolute', top: topPad, left: 0, right: 0, bottom: 0 }}>
          <SettingsScreen
            settings={settings}
            onChange={setSettings}
            onBack={() => setShowSettings(false)}
            colors={colors}
          />
        </View>
      )}
    </View>
  );
}
