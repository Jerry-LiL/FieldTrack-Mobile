import authReducer, { setUser, clearAuthError, loginUser, logoutUser } from '../../store/authSlice';
import { AuthState } from '../../types/auth';

describe('authSlice', () => {
  const initialState: AuthState = {
    user: null,
    token: null,
    status: 'idle',
    error: null,
  };

  it('handles initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('handles setUser', () => {
    const user = {
      id: 'usr_test',
      email: 'test@fieldtrack.dev',
      name: 'Test User',
      role: 'Inspector',
    };
    const state = authReducer(initialState, setUser(user));
    expect(state.user).toEqual(user);
    expect(state.status).toBe('authenticated');
  });

  it('handles clearAuthError', () => {
    const stateWithError: AuthState = {
      ...initialState,
      error: 'Invalid password',
    };
    const state = authReducer(stateWithError, clearAuthError());
    expect(state.error).toBeNull();
  });

  it('handles loginUser.fulfilled', () => {
    const payload = {
      token: 'jwt_mock_token_123',
      user: {
        id: 'usr_vineet',
        email: 'vineet@fieldtrack.dev',
        name: 'Vineet Kumar',
        role: 'Field Engineer',
      },
    };

    const action = {
      type: loginUser.fulfilled.type,
      payload,
    };

    const state = authReducer(initialState, action);
    expect(state.status).toBe('authenticated');
    expect(state.token).toBe('jwt_mock_token_123');
    expect(state.user?.name).toBe('Vineet Kumar');
    expect(state.error).toBeNull();
  });

  it('handles logoutUser.fulfilled', () => {
    const loggedInState: AuthState = {
      user: {
        id: 'usr_1',
        email: 'test@fieldtrack.dev',
        name: 'User',
        role: 'Tech',
      },
      token: 'mock_token',
      status: 'authenticated',
      error: null,
    };

    const state = authReducer(loggedInState, { type: logoutUser.fulfilled.type });
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});
