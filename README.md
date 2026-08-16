# LifePilot — Complete React Native & Firebase Personal Command Center

**LifePilot** is an all-in-one daily productivity and life assistant mobile application built with **React Native (Expo SDK 57)**, **TypeScript**, **Expo Router**, and **Firebase Modular SDK (v12)**. 

It provides daily task management, habit streak tracking, rich notes with attachments, expense categorization, personal goal tracking, document vaults, low-latency live presence status, and automated productivity insights — wrapped in a modern, fully responsive UI design.

---

## 📱 Key Features

* 🏠 **Home Dashboard**: Live overview of today's completed tasks, active habit streaks, today's spending, active goals, live status badge, and quick action shortcuts.
* ✅ **Tasks Manager**: Organize daily todos by priority (`Low`, `Medium`, `High`) and category (`Work`, `Personal`, `Health`, `Finance`, `Learning`, `Other`). Supports due dates, reminders, tap-to-edit, and filter views.
* 🔥 **Habit Tracker**: Build daily discipline with automatic streak calculations (`currentStreak`, `bestStreak`), today's completion percentage, and interactive checkmarks.
* 📝 **Personal Notes**: Clean notes system with live keyword search, pin/unpin toggles, and photo/document file attachments.
* 💳 **Expense Tracker**: Track daily spending with category breakdowns (`Food`, `Transport`, `Shopping`, `Bills`, `Entertainment`, `Other`) and dynamic month/week/today spending totals.
* 🎯 **Personal Goals**: Track long-term milestones with custom target values, progress increments, and visual progress bars.
* 📂 **Document Vault**: Store receipts, ID proofs, certificates, and contracts securely in Firebase Storage / Cloudinary.
* 🟢 **Live Productivity Status**: Real-time presence indicator (`Working`, `Break`, `Completed`, `Offline`) powered by Firebase Realtime Database.
* 📊 **Productivity Intelligence**: Daily weighted productivity score (0–100%) and contextual insights calculated from your actual activities.
* 🔔 **Notification Center**: Push reminder alerts, FCM token status, and configurable notification categories.
* ⚙️ **Settings & Customization**: Light/Dark theme switch, Firebase connection diagnostics, Remote Config flags, Crashlytics test error trigger, and secure sign out.

---

## 📐 Responsive Design System

LifePilot is built with a responsive scaling utility (`src/utils/responsive.ts`) authored for `390 × 844` (iPhone 14 / Pixel 7) that scales proportionally across any mobile screen, tablet, or orientation:

* `s(size)`: Horizontal scaling for widths, horizontal padding, and margins.
* `vs(size)`: Vertical scaling for heights, vertical padding, and sheet modals.
* `ms(size, factor)`: Moderate scaling for border radii, icon wrappers, and badges.
* `mvs(size, factor)`: Moderate vertical scaling for responsive heights.
* `fs(size)`: Font scaling with upper and lower bound protection for legibility.
* `wp(percent)` / `hp(percent)`: Percentage-based screen dimension helpers.
* `useResponsive()`: Reactive React hook providing dynamic screen metrics on screen rotation or window resize.

---

## 🏗️ Architecture & Project Structure

```text
FirebaseLearningApp/
├── app.json                       # Expo configuration & native plugins
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript compiler settings
├── firestore.rules                # Cloud Firestore security rules
├── storage.rules                  # Firebase Storage security rules
├── database.rules.json            # Realtime Database security rules
├── firebase.json                  # Firebase CLI configuration & emulator setup
├── .env.example                   # Environment variable template
├── README.md                      # Comprehensive documentation
├── functions/                     # Firebase Cloud Functions codebase
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # Cloud Functions entry point
│       ├── dailySummary.ts        # Daily productivity calculator
│       ├── weeklySummary.ts       # Weekly aggregator
│       ├── reminderProcessor.ts   # Cron background reminder worker
│       └── dataValidation.ts      # Server-side validation rules
└── src/
    ├── firebase/                  # Modular Firebase service layer
    │   ├── config.ts              # Firebase initialization & AsyncStorage auth
    │   ├── auth.ts                # Authentication helpers & state listener
    │   ├── firestore.ts           # Firestore collection wrappers
    │   ├── storage.ts             # File upload/delete storage utilities
    │   ├── messaging.ts           # Push notification registration & scheduling
    │   ├── analytics.ts           # Privacy-conscious Analytics abstraction
    │   ├── crashlytics.ts         # Crash reporting & non-fatal error logging
    │   ├── remoteConfig.ts        # Over-the-air feature flags
    │   ├── appCheck.ts            # App Check resource protection
    │   └── realtimeDatabase.ts    # Live presence (Realtime DB)
    ├── services/                  # Business logic services
    ├── components/                # Reusable UI components & Error Boundary
    │   └── ui/
    │       ├── Button.tsx         # Responsive button with shadow & feedback
    │       ├── Input.tsx          # Responsive input with multiline & focus state
    │       ├── Card.tsx           # Responsive card with elevation
    │       ├── Badge.tsx          # Translucent pill badges
    │       ├── Header.tsx         # Responsive header with circular back button
    │       ├── EmptyState.tsx     # Responsive empty state illustration
    │       └── ProgressBar.tsx    # Responsive animated progress bar
    ├── hooks/                     # Custom React Hooks
    │   ├── useAuth.ts
    │   ├── useTasks.ts
    │   ├── useHabits.ts
    │   ├── useNotes.ts
    │   ├── useExpenses.ts
    │   ├── useGoals.ts
    │   ├── useDocuments.ts
    │   ├── useNotifications.ts
    │   ├── useLiveStatus.ts
    │   └── useRemoteConfig.ts
    ├── types/                     # TypeScript domain interfaces
    ├── utils/                     # Responsive utility & formatters
    │   ├── responsive.ts          # Core responsive scaling engine
    │   ├── dateUtils.ts
    │   └── formatters.ts
    ├── constants/                 # Theme & categories
    │   ├── theme.ts
    │   └── categories.ts
    └── app/                       # Expo Router application screens
        ├── _layout.tsx            # Root layout (Theme, Auth, ErrorBoundary, AppCheck)
        ├── (auth)/                # Auth routes (Welcome, Login, Register, Reset, Verify)
        ├── (tabs)/                # Tab navigator (Home, Tasks, Habits, Notes, Expenses)
        └── screens/               # Modal & detail screens (Goals, Documents, Notifications, Settings, etc.)
```

---

## ⚡ Firebase Services Integrated

1. **Firebase Authentication**: Email/Password login, registration, email verification, password reset, and session persistence.
2. **Cloud Firestore**: Real-time NoSQL database storing tasks, habits, notes, expenses, goals, and daily metrics scoped to `users/{uid}/*`.
3. **Firebase Storage**: Cloud binary storage for uploaded receipts, certificates, and profile pictures.
4. **Firebase Realtime Database**: Low-latency WebSocket presence sync for live session status (`Working`, `Break`, `Completed`, `Offline`).
5. **Firebase Cloud Messaging (FCM)**: Push reminder alerts and local notification scheduling.
6. **Firebase Analytics**: User activity and productivity telemetry tracking.
7. **Firebase Crashlytics**: Crash reporting, breadcrumbs, and error boundary recovery.
8. **Firebase Remote Config**: Over-the-air feature flags (`maintenance_mode`, `max_free_documents`, `daily_quote_enabled`).
9. **Firebase App Check**: App attestation and security protection.
10. **Firebase Cloud Functions**: Serverless background score aggregation and scheduled reminders.

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **Expo CLI**: `npm install -g expo-cli`
* **Firebase CLI**: `npm install -g firebase-tools`

### 2. Installation
```bash
# Install mobile dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Firebase credentials in `.env`:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Running the App
```bash
# Run TypeScript compilation check
npx tsc --noEmit

# Start Expo Development Server
npx expo start
```

---

## 📄 License
This project is licensed under the MIT License — created by Bhavya as a complete, modern React Native & Firebase productivity application.
