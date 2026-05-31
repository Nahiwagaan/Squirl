# <img src="assets/images/logo.png" alt="Squirl" width="24"> Squirl

**Squirl** is a premium, all-in-one personal finance and budgeting app designed to help you take control of your money. Built with **Expo** and **SQLite**, it lets you track income and expenses, manage wallets, plan bills and goals, monitor debts, and visualize your cashflow—all from your mobile device.

---

## 📲 Download & Install

You can download the latest **Android APK** directly from the link below:

### [📥 Download Squirl v1.0.0 (APK)](https://wf-artifacts.eascdn.net/builds/internal-st/3d0576ca-4ab4-41b8-a6db-0530c7616e40/1c44123c-31b9-41a3-80a3-f9009b81c0fd/019e7b55-b575-70a9-ab67-83921bf15da2/application-1c44123c-31b9-41a3-80a3-f9009b81c0fd.apk?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=75d871a1a44e598975dd84fa2341c9b0%2F20260531%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260531T000225Z&X-Amz-Expires=900&X-Amz-Signature=0966dab017db6134347e0d69315f1456761dee615968c0abf0807ee4e4826881&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

> **Note for Installation:** Since this is a custom-built app, Android might show a "Play Protect" warning. Simply click **"Install Anyway"** to proceed with the installation.

---

## ✨ Key Features

- 🚀 **Onboarding & Profile Setup**: Get started quickly with a guided setup flow — set your name, salary, pay frequency, and payday reminder in minutes.
- 🏠 **Smart Dashboard**: A rich home screen showing a 6-month cashflow chart (income vs. expenses), this-month summary cards, and a payday reminder.
- ➕ **Quick Add Actions**: Instantly log **Income**, **Expense**, or **Transfer** transactions from a convenient modal.
- 💰 **Wallet Management**: View your net worth and manage multiple account cards in one place.
- 📅 **Plan Page**: Organize upcoming bills and financial goals with list and calendar views.
- 📜 **Transaction History**: Browse recent transactions with totals and full history at a glance.
- 🤝 **Debts Tracker**: Keep tabs on money you owe and money owed to you, all in one dedicated screen.
- 💬 **Chat**: Built-in chat screen for notes or AI-assisted finance tips.
- 🌓 **Dark Mode Support**: A beautiful, premium UI that automatically adapts to your system theme.
- 🔒 **Local & Private**: All data is stored locally on your device via `expo-sqlite`. No cloud, no internet required.

---

## 🏗️ Technology Stack

- **Framework**: [Expo SDK 54](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (native) / localStorage fallback (web)
- **UI**: React Native with custom premium styling, Expo Linear Gradient, Expo Blur
- **Fonts**: Inter, Inclusive Sans, Itim (via `@expo-google-fonts`)
- **Language**: TypeScript

---

## 🧹 Data Management

You can reset all app data at any time via the **Settings** page. This is useful for a fresh start or testing purposes. Use with caution — this action is irreversible.

---

## 📝 Changelog

### 2026-05-31
- **Fix: "This Month In / Out" now shows the correct monthly totals**