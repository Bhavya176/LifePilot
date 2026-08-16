# 🚀 LifePilot — All-in-One Life Command Center & Productivity Suite

<p align="center">
  <img src="https://img.shields.io/badge/Expo-v57.0.0-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/React%20Native-0.86.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-v12.17.1-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Cloudinary-100%25%20Free%20Tier-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

**LifePilot** is a production-grade personal productivity and life assistant mobile application built with **React Native**, **Expo SDK 57**, **Expo Router**, **Firebase Modular SDK (v12)**, and **Cloudinary Free Tier**.

It merges task management, habit streak tracking, rich notes with attachments, modern Fintech expense tracking with category budgets, personal goal milestones, encrypted document vaults, Pomodoro focus timers, live co-working rooms, and real-time community chat — engineered with an Apple/Notion-level responsive design system and 100% Free-Tier cloud infrastructure.

---

## ✨ Key Features & Capabilities

### 🎮 1. Unified Dashboard & XP Gamification Engine
- **Unified Overview Card**: Merges daily stats (Tasks, Habits, Spending, Goals) with your current Explorer XP level tier.
- **Action-based XP Rewards**: Gain XP for completing tasks (+10 XP), streaks (+50 XP), logging expenses (+5 XP), and finishing goals (+100 XP).
- **Celebration Modals**: Full-screen level-up overlays celebrating your productivity milestones.

### 🍅 2. Pomodoro Focus Timer & 👥 Live Focus Rooms
- **Circular Pomodoro Timer**: 25m Focus / 5m Short Break / 15m Long Break with circular SVG progress animation, sound feedback, and +20 XP bonuses.
- **Live Co-Working Focus Room**: Join real-time study/work sessions with other users powered by low-latency **Firebase Realtime Database**.
- **Real-Time Community Chat**: Live typing indicators, message reactions (👍, ❤️, 🔥, 🚀), and instant message streaming.

### 💳 3. Modern Fintech Expense Tracker & Donut Analytics
- **Fintech Spending Card**: Dynamic month-to-date total, Today's spending, and 7-day trailing total.
- **SVG Donut Breakdown**: Dynamic category distribution with high-contrast color pills and percentages.
- **Monthly Category Budgets**: Set spending limits per category with 80% warning and 100% threshold alert notifications.
- **Export Statements**: One-tap export to formatted **PDF Statements** and **CSV Spreadsheets**.

### 📅 4. Interactive Monthly Calendar & Global Search
- **Monthly Calendar Matrix**: Month-at-a-glance view with color-coded badges for due tasks, logged expenses, and active habit streaks.
- **Unified Global Search**: Lightning-fast keyword search across Tasks, Notes, Habits, Expenses, and Goals simultaneously.

### 📝 5. Rich Notes & 📸 Photo Attachments
- Markdown-style rich notes with keyword search, pin/unpin toggling, and fast photo/document attachments powered by **Cloudinary Free Tier**.

### 🔐 6. Encrypted Document Vault with Biometrics
- Store sensitive receipts, ID cards, certificates, and contracts with **Face ID / Fingerprint App Lock protection**.

### 📢 7. Dynamic Banners & Daily Inspiration
- Over-the-air broadcast announcements and daily motivational quotes driven remotely via **Firebase Remote Config**.

### 🔔 8. Intelligent Notification Center
- **🌅 Morning Briefing (8:00 AM)**: Daily scheduled task overview.
- **🌙 Night Recap (9:00 PM)**: Summary of completed habits and total money spent.
- **🎯 Goal Milestones**: Instant celebration alerts when reaching 50% and 100% of target values.

---

## ⚡ 100% Free-Tier Cloud Architecture

LifePilot is architected to run **100% FREE on the Firebase Spark Plan and Cloudinary Free Tier** without needing a credit card or paid Blaze billing:

| Service | Technology | Cost / Tier |
|---|---|---|
| **User Authentication** | Firebase Auth (Email/Pass, Reset, Verification) | 100% Free (Spark) |
| **NoSQL Database** | Cloud Firestore with Persistent Local Cache | 100% Free (Spark) |
| **Realtime Sync** | Firebase Realtime Database (Presence & Chat) | 100% Free (Spark) |
| **Media & File Storage** | Cloudinary REST Upload API | 100% Free (Forever) |
| **Remote Feature Flags** | Firebase Remote Config | 100% Free (Spark) |
| **Productivity Telemetry** | Google Analytics for Firebase | 100% Free (Spark) |
| **Crash Diagnostics** | Firebase Crashlytics & Error Boundary | 100% Free (Spark) |
| **API Abuse Protection** | Firebase App Check (DeviceCheck / Play Integrity) | 100% Free (Spark) |
| **Push Notifications** | Expo Notifications & Local Alert Schedulers | 100% Free |

---

## 📐 Responsive UI Design System

LifePilot features a responsive scaling engine (`src/utils/responsive.ts`) calibrated for `390 × 844` baseline (iPhone 14 / Pixel 7) that scales fluidly across all iOS and Android display sizes:

- `s(size)`: Horizontal scaling for widths, margins, and horizontal padding.
- `vs(size)`: Vertical scaling for heights, bottom sheets, and vertical spacing.
- `ms(size, factor)`: Moderate scaling for border radii, icon chips, and circular badges.
- `fs(size)`: Dynamic typography scaling with legibility constraints.
- `useTheme()`: Instant OLED Dark Mode and Clean Daylight Light Mode switching.

---

## 📂 Project Structure

```text
LifePilot/
├── app.json                       # Expo SDK 57 app manifest & plugins
├── package.json                   # Dependencies & build scripts
├── tsconfig.json                  # TypeScript compiler settings
├── firestore.rules                # Cloud Firestore user isolation rules
├── database.rules.json            # Realtime Database security rules
├── firebase.json                  # Firebase CLI configuration
├── .env                           # Active environment keys
├── src/
│   ├── app/                       # Expo Router file-based navigation
│   │   ├── _layout.tsx            # Root layout with theme, auth & error boundary
│   │   ├── (auth)/                # Auth flows (Welcome, Login, Register, Forgot)
│   │   ├── (tabs)/                # Bottom navigation tabs
│   │   │   ├── index.tsx          # Home Command Center
│   │   │   ├── tasks.tsx          # Task Manager
│   │   │   ├── habits.tsx         # Habit Streak Tracker
│   │   │   ├── notes.tsx          # Notes & Attachments
│   │   │   └── expenses.tsx       # Fintech Expense Tracker & Budgets
│   │   └── screens/               # Modal and detail screens
│   │       ├── pomodoro.tsx       # Pomodoro Focus Timer
│   │       ├── focus-room.tsx     # Live Co-Working Focus Room
│   │       ├── community-chat.tsx # Real-Time Community Chat
│   │       ├── calendar.tsx       # Interactive Monthly Calendar
│   │       ├── search.tsx         # Universal Global Search
│   │       ├── analytics.tsx      # Productivity Analytics & Score
│   │       ├── documents.tsx      # Encrypted Document Vault
│   │       ├── goals.tsx          # Goal Milestones
│   │       ├── notifications.tsx  # Push Notification Center
│   │       ├── settings.tsx       # Production Settings Center
│   │       └── profile.tsx        # User Profile Management
│   ├── firebase/                  # Modular Firebase & Cloudinary Services
│   │   ├── config.ts              # Firebase Client initialization
│   │   ├── auth.ts                # Authentication helpers & friendly errors
│   │   ├── firestore.ts           # Firestore collection wrappers & cache
│   │   ├── storage.ts             # Cloudinary 100% Free Upload Engine
│   │   ├── realtimeDatabase.ts    # Realtime presence, chat & focus rooms
│   │   ├── messaging.ts           # Push notifications & briefings
│   │   ├── remoteConfig.ts        # Dynamic announcements & quotes
│   │   ├── analytics.ts           # Privacy-focused analytics
│   │   ├── crashlytics.ts         # Crash reporting & diagnostics
│   │   └── appCheck.ts            # Resource attestation
│   ├── components/ui/             # Reusable UI component library
│   │   ├── UnifiedOverviewCard.tsx
│   │   ├── ExpensePieChart.tsx
│   │   ├── BudgetCard.tsx
│   │   ├── LevelUpOverlay.tsx
│   │   ├── DynamicAnnouncementBanner.tsx
│   │   ├── DynamicDailyQuoteCard.tsx
│   │   ├── QuickAddFAB.tsx
│   │   ├── Header.tsx
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   └── Badge.tsx
│   ├── hooks/                     # Custom React Hooks
│   ├── services/                  # Business logic (Gamification, Export, etc.)
│   ├── context/                   # Context Providers (Auth, Theme, Network, Security)
│   ├── utils/                     # Responsive metrics & date formatters
│   └── constants/                 # Curated color palettes & theme tokens
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Expo Go** app on your physical iOS/Android device or Xcode/Android Studio simulator.

### 2. Installation
```bash
# Clone repository
git clone https://github.com/Bhavya176/LifePilot.git
cd LifePilot

# Install dependencies
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Firebase Project Keys (Spark Plan - 100% Free)
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Cloudinary Keys (100% Free Tier - No Credit Card Needed)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 4. Run the Application
```bash
# Run TypeScript type-check
npx tsc --noEmit

# Start Expo Development Server
npx expo start
```

---

## 📜 License
This project is open-source and licensed under the **MIT License** — built with ❤️ by **Bhavya**.
