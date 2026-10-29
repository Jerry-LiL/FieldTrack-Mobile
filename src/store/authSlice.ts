import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../types/auth';
import { loginApi, getProfileApi } from '../api/authApi';
import {
  saveAuthToken,
  saveAuthUser,
  getAuthToken,
  getAuthUser,
  clearAuthSession,
} from '../storage/secureStore';

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await loginApi(credentials.email, credentials.password);
      await saveAuthToken(response.token);
      await saveAuthUser(response.user);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return null;
      }
      const cachedUser = await getAuthUser();
      try {
        // Try to verify token online
        const { user } = await getProfileApi();
        await saveAuthUser(user);
        return { token, user };
      } catch (_onlineErr) {
        // Fall back to offline cached user if token exists
        if (cachedUser) {
          return { token, user: cachedUser };
        }
        return null;
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Session restoration failed');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await clearAuthSession();
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) || 'Authentication failed';
      })
      // Restore session
      .addCase(restoreSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.status = 'authenticated';
          state.token = action.payload.token;
          state.user = action.payload.user;
        } else {
          state.status = 'unauthenticated';
          state.token = null;
          state.user = null;
        }
      })
      .addCase(restoreSession.rejected, (state) => {
        state.status = 'unauthenticated';
        state.token = null;
        state.user = null;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'unauthenticated';
        state.token = null;
        state.user = null;
        state.error = null;
      });
  },
});

export const { setUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
