# FieldTrack Mobile

Offline-first task and expense tracker for mobile technicians. Changes are saved on the device, queued while offline, and synced to the API when the connection comes back (last write wins on conflicts).

## Stack

- React Native, Expo SDK 52, TypeScript
- Redux Toolkit, React Navigation
- AsyncStorage, Expo SecureStore
- Express mock server

## Development

```bash
# Install dependencies
npm install
npm --prefix server install

# Start mock backend (runs on :4000)
npm run server

# Start mobile app
npm start
```

Default credentials: `vineet@fieldtrack.dev` / `password123`.
To seed mock records on the server: `npm run seed`.

## Tests

```bash
npm test
npm --prefix server test
npm run lint
npm run typecheck
npm --prefix server run typecheck
```

## Features

- Offline CRUD for tasks and expenses backed by AsyncStorage
- Mutation queue with compaction replayed on reconnection
- Timestamp-based last-write-wins conflict handling
- JWT authentication saved in SecureStore with session restore
- Filterable virtualized lists with status and category filtering
- Expense summary screen with a per-category breakdown

## API Endpoints

- POST `/api/auth/login`, GET `/api/auth/me`
- GET, POST `/api/tasks`
- GET, PUT, DELETE `/api/tasks/:id`
- POST `/api/tasks/sync`
- GET, POST `/api/expenses`
- GET, PUT, DELETE `/api/expenses/:id`
- POST `/api/expenses/sync`
- POST `/api/seed/reset`, POST `/api/seed/benchmark`

## TODO

- SQLite migration for larger datasets
- Camera receipt capture with local file caching
- Delta sync protocol using timestamp cursors
