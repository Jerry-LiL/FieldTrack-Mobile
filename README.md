# FieldTrack Mobile

An offline-first field task and expense tracker built for mobile technicians and inspectors working in environments with intermittent or zero network connectivity.

Local edits to tasks and expenses are committed immediately to local storage and recorded in an offline mutation queue. When the device reconnects, the queue is replayed against the backend API using Last-Write-Wins (LWW) timestamp conflict resolution.

## Features

- **JWT Authentication**: Token-based authentication with credentials stored in `expo-secure-store` and automatic session restoration on app boot.
- **Offline-First CRUD**: Full local creation, modification, and deletion for tasks and expenses backed by `@react-native-async-storage/async-storage`.
- **Sync Queue & LWW Conflict Handling**: Offline mutations are compacted (merging consecutive updates and dropping uncommitted creates on delete) and replayed on reconnection. Conflicting concurrent edits are resolved via timestamps (latest timestamp wins).
- **Network Status Indicator**: Displays real-time connection state (`Online (synced)`, `Offline (N pending)`, `Syncing...`, or `Sync failed`) with tap-to-retry and a sync inspection screen.
- **Virtualized Lists**: FlatLists for both tasks and expenses tuned with `getItemLayout`, `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, and `removeClippedSubviews` for smooth 60fps scrolling with 1,000+ seeded records.
- **Instant Search & Filtering**: Client-side filtering by query string, task status, priority, and expense categories.
- **Financial Summary Screen**: High-level expense dashboard with total spend, average cost per item, category breakdown progress bars, and recent activity.
- **Mock Server**: Node.js and Express backend in `/server` providing auth, CRUD endpoints, and a batch `/sync` route with LWW conflict detection.

## Architecture

```mermaid
flowchart TD
    UI[React Native Screens & Components] --> Redux[Redux Toolkit State Store]
    Redux --> LocalStorage[AsyncStorage & SecureStore]
    Redux --> SyncQueue[Offline Sync Queue]
    NetInfo[@react-native-community/netinfo] --> SyncManager[Sync Manager]
    SyncQueue --> SyncManager
    SyncManager -->|Replay batch mutations| ServerAPI[Mock Express Server /api]
    ServerAPI -->|LWW Resolution & Canonical Records| SyncManager
    SyncManager -->|Reconcile| Redux
```

## Tech Stack

- **Mobile Client**: React Native (0.76.7), Expo SDK 52, TypeScript 5.3
- **State Management**: Redux Toolkit 2.2, React Redux 9.1
- **Navigation**: React Navigation 6 (Bottom Tabs & Native Stack)
- **Local Persistence**: `@react-native-async-storage/async-storage` for application state, `expo-secure-store` for JWT tokens
- **Connectivity**: `@react-native-community/netinfo`
- **Testing**: Jest 29, `jest-expo` 52, `@testing-library/react-native`
- **Mock Server**: Node.js, Express 4.19, `jsonwebtoken`, TypeScript, `ts-node`, `supertest`

## Project Structure

```text
FieldTrack-Mobile/
├── App.tsx                     # Main application entry and network listener
├── app.json                    # Expo project configuration
├── babel.config.js             # Babel preset configuration
├── jest.config.js              # Jest configuration with jest-expo preset
├── jest.setup.js               # Global mocks for AsyncStorage, SecureStore, NetInfo
├── package.json                # Mobile app dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── src/
│   ├── api/                    # HTTP client and API functions (auth, tasks, expenses)
│   ├── components/             # Reusable UI components (TaskCard, ExpenseCard, SyncStatusBar)
│   ├── config/                 # Environment variables and constants
│   ├── navigation/             # AppNavigator and navigation type definitions
│   ├── screens/                # UI screens (Login, Tasks, Expenses, Summary, Sync)
│   ├── storage/                # AsyncStorage and SecureStore wrappers
│   ├── store/                  # Redux slices (auth, tasks, expenses, sync) and hooks
│   ├── sync/                   # SyncManager, SyncQueue, and Last-Write-Wins resolver
│   ├── types/                  # Shared domain interfaces (auth, task, expense, sync)
│   ├── utils/                  # Date, currency, ID, and 1k+ benchmark seed generators
│   └── __tests__/              # Unit and integration test suites
│       ├── reducers/           # Redux slice tests
│       ├── screens/            # Screen rendering and interaction tests
│       └── sync/               # Queue compaction and conflict resolution tests
└── server/
    ├── package.json            # Mock server dependencies and scripts
    ├── tsconfig.json           # Server TypeScript configuration
    ├── src/
    │   ├── index.ts            # Server entry point (binds PORT)
    │   ├── server.ts           # Express application setup and routes
    │   ├── middleware/         # Bearer JWT auth verification
    │   ├── routes/             # Routes: /auth, /tasks, /expenses, /seed
    │   └── data/               # In-memory datastore with demo records
    └── __tests__/              # Server endpoint and sync integration tests
```

## Getting Started

### Prerequisites

- Node.js (tested on v20.x and v24.x)
- npm 10+

### 1. Install Dependencies

Install root (mobile app) dependencies:

```bash
npm install
```

Install server dependencies:

```bash
cd server
npm install
cd ..
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default values work out of the box for emulator / local development:
- `EXPO_PUBLIC_API_URL`: `http://localhost:4000/api`
- `PORT`: `4000`

### 3. Start the Mock Server

In a dedicated terminal:

```bash
npm run server
```

The server starts on `http://localhost:4000` and displays:
```text
FieldTrack mock server running on http://localhost:4000
Default login: vineet@fieldtrack.dev / password123
```

To seed 1,000 tasks and 500 expenses directly into the server:

```bash
npm run seed
```

### 4. Start the Mobile App

In another terminal:

```bash
npm start
```

Press `w` to open web, `a` for Android emulator, or `i` for iOS simulator.

### Default Credentials

- **Email**: `vineet@fieldtrack.dev`
- **Password**: `password123`
- (A "Fill Demo Account" button is available on the Login screen)

## API Examples

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "vineet@fieldtrack.dev",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "usr_vineet",
    "email": "vineet@fieldtrack.dev",
    "name": "Vineet Kumar",
    "role": "Field Engineer"
  }
}
```

### Batch Sync with Last-Write-Wins

```http
POST /api/tasks/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "mutations": [
    {
      "mutationId": "mut_1730000000_abc",
      "entity": "task",
      "action": "UPDATE",
      "id": "task_001",
      "payload": {
        "status": "completed",
        "description": "Inspection completed successfully"
      },
      "timestamp": 1730000005000
    }
  ]
}
```

Response:
```json
{
  "applied": ["mut_1730000000_abc"],
  "conflicts": [],
  "currentRecords": [
    {
      "id": "task_001",
      "title": "Inspect HVAC unit at Sector 4B",
      "status": "completed",
      "updatedAt": 1730000005000
    }
  ]
}
```

If a client mutation has an `updatedAt` older than the server's record, it is rejected with a conflict object:
```json
{
  "applied": [],
  "conflicts": [
    {
      "id": "task_001",
      "clientTimestamp": 1729900000000,
      "serverTimestamp": 1730000005000,
      "serverRecord": { "id": "task_001", "status": "completed" },
      "resolution": "server_wins"
    }
  ]
}
```

## Running Tests and Linting

Run ESLint:

```bash
npm run lint
```

Run TypeScript compiler typecheck:

```bash
npm run typecheck
cd server && npm run typecheck && cd ..
```

Run test suites:

```bash
# Mobile test suite (48 tests across 9 suites)
npm test

# Server test suite (8 tests across 1 suite)
cd server && npm test && cd ..
```

Total test count across client and server: 56 passing tests.

## What I'd Improve Next

1. **SQLite Native Driver**: Replace AsyncStorage with `expo-sqlite` and compile with prebuilt binaries for relational queries when task volumes exceed 10,000 items.
2. **Photo Attachments**: Integrate `expo-image-picker` with local filesystem caching (`expo-file-system`) for offline camera receipt and damage capture.
3. **Delta Sync Protocol**: Instead of pulling canonical records on replay, implement cursor-based sync tokens (`since=<timestamp>`) to minimize mobile bandwidth over cellular.
4. **Push Notifications**: Background sync alerts via Expo Notifications when high-priority tasks are dispatched from dispatch.

## License

MIT (c) 2026 Vineet Kumar
