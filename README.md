# Darts AutoScore

Mobiele app (iPhone + Android) voor het bijhouden van darts. **Fase 1:** handmatige score-app (301/501).
Latere fases: telefooncamera, dartbord herkennen, automatisch scoren.

## Starten
```bash
npm install
npx expo start
```
Installeer **Expo Go** (App Store / Play Store) op je telefoon en scan de QR-code uit de terminal.
Telefoon en computer moeten op hetzelfde wifi-netwerk zitten. Lukt dat niet: `npx expo start --tunnel`.
Ook in de browser: `npx expo start --web`.

## Tests
```bash
npm test          # spelregels (11 tests)
npm run typecheck # TypeScript
```

## Structuur
```
App.tsx                  start, laden/bewaren van het spel
src/engine/rules.ts      bust, double-out, uitgooien (puur, geen UI)
src/engine/game.ts       spelstatus, ongedaan maken, corrigeren, statistieken
src/engine/checkout.ts   uitgooi-tips
src/state/storage.ts     lokaal opslaan (werkt offline)
src/screens/             SetupScreen, GameScreen
src/components/          Keypad, PlayerCard, HistorySheet, StatsTable, ...
```
De spellogica kent geen UI of camera. Later levert de camera per dart een score aan dezelfde engine.

## Accounts (optioneel, Supabase)
Zonder configuratie werkt de app volledig offline. Met accounts bewaar je afgeronde spellen en statistieken online.
1. Maak een Supabase-project en voer `supabase/migrations/20261112000000_darts_accounts.sql` uit (SQL Editor).
2. Supabase -> Authentication -> Emails -> Templates: plak `supabase/email-templates/confirm-signup.html` (Confirm signup)
   en `reset-password.html` (Reset password). De app gebruikt **codes** in de mail, geen links.
3. Zet `EXPO_PUBLIC_SUPABASE_URL` en `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (lokaal) en in Vercel -> Environment Variables.
4. Opnieuw starten / deployen.
