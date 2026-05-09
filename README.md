# Squirl

![Squirl Logo](assets/images/logo.png)

Squirl is a personal finance and budgeting app built with Expo + React Native.

It helps users set up their profile, track income/expenses, view cashflow and history, manage wallets, plan bills/goals, and monitor debts/owed money.

## Features

- Onboarding flow (`/` and `/setup`) with profile, salary, frequency, and payday reminder setup
- Home dashboard with:
  - 6-month cashflow chart (income vs expense)
  - this-month income/out summary cards
  - payday reminder card
- Quick Add modal actions:
  - Income
  - Expense
  - Transfer
- Transaction screens:
  - `app/income.tsx`
  - `app/expense.tsx`
  - `app/transfer.tsx`
- Wallet page with net worth and account cards
- Plan page with list/calendar view scaffold for bills/goals
- History page with recent transactions and totals
- Debts page (I Owe / Owed to Me)
- Shared reusable UI:
  - `components/dashboard-header.tsx`
  - `components/squirl-banner.tsx`

## Tech Stack

- Expo SDK 54
- React Native + Expo Router
- TypeScript
- SQLite (`expo-sqlite`) on native
- localStorage fallback on web (`lib/database.ts`)

## Project Structure

- `app/(tabs)` - tab screens (Home, Wallet, Plan, History)
- `app/*.tsx` - stack screens (Income, Expense, Transfer, Debts, Setup)
- `components/` - shared UI components
- `lib/` - data storage layer (web + native)
- `assets/images/` - logos, mascots, and bank images

## Run Locally

1. Install dependencies

```bash
npm install
```

2. Start development server

```bash
npx expo start
```

3. Open on device/emulator/web from Expo CLI options.

## Notes

- App icon/logo uses `assets/images/logo.png`.
- The app currently uses seeded/static UI data in some sections (e.g., parts of Plan, Wallet cards) while core transaction/history flows are already connected.

## Scripts

- `npm run start` - start Expo
- `npm run android` - launch Android via Expo
- `npm run ios` - launch iOS via Expo
- `npm run web` - launch web
- `npm run lint` - run lint checks
