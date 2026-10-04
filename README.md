# Arbitrage escrime — code complet

Application Expo / React Native, 100 % locale (aucune connexion nécessaire).

## Contenu
- `src/EscrimeApp.tsx` : application complète (sélecteur Simple / Poule, réglages)
- `src/matchLogic.ts` : règles du match (chrono, scores, passivité, cartons, fin de match, touche décisive)
- `src/poolLogic.ts` : poules (ordre des matchs, classement V/M puis indice puis touches données)
- `src/presets.ts` : formats FIE (Poules, Élimination directe, Vétérans, Équipes)
- `src/screens/` : MatchScreen, PoolScreen, SettingsScreen
- `src/utils.ts` : stockage local, son, couleurs
- `assets/beep.wav` : son embarqué

## Projet Expo
Ce dépôt est un projet Expo complet (`package.json`, `app.json`, `App.tsx`).
Versions choisies pour Expo SDK 54. Si une version pose problème, lancer `npx expo install --fix`.

## Règles intégrées (FIE, règlement technique d'août 2026)
- Mode Simple : aucune limite de points, fin du temps = « Temps écoulé », sans vainqueur.
- Mode Poule : fin automatique au score cible, égalité = tirage au sort puis 1:00 de touche décisive.
- Épée en poules : à 4-4, touche décisive. Sabre (plusieurs périodes, mode Poule) : pas de limite de temps, chrono vers le haut, pause dès ⌈cible/2⌉ touches.
- Équipes : relais de 5 touches cumulées (fin automatique en mode Poule uniquement).
- Cartons : 2 jaunes = rouge ; rouge puis jaune = rouge ; chaque rouge = +1 pour l'adversaire ; noir manuel.
