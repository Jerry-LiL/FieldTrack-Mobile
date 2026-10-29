import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import taskReducer from './taskSlice';
import expenseReducer from './expenseSlice';
import syncReducer from './syncSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    expenses: expenseReducer,
    sync: syncReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
