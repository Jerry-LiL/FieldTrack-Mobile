import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LoginScreen } from '../../screens/LoginScreen';
import authReducer from '../../store/authSlice';
import taskReducer from '../../store/taskSlice';
import expenseReducer from '../../store/expenseSlice';
import syncReducer from '../../store/syncSlice';

function renderLoginScreen(preloadedState = {}) {
  const testStore = configureStore({
    reducer: {
      auth: authReducer,
      tasks: taskReducer,
      expenses: expenseReducer,
      sync: syncReducer,
    },
    preloadedState,
  });

  return {
    ...render(
      <Provider store={testStore}>
        <LoginScreen />
      </Provider>
    ),
    store: testStore,
  };
}

describe('LoginScreen', () => {
  it('renders login form correctly with title and inputs', () => {
    const { getByText, getByTestId } = renderLoginScreen();

    expect(getByText('FieldTrack Mobile')).toBeTruthy();
    expect(getByTestId('login-email-input')).toBeTruthy();
    expect(getByTestId('login-password-input')).toBeTruthy();
    expect(getByTestId('login-submit-button')).toBeTruthy();
  });

  it('populates demo credentials when tapping demo account button', () => {
    const { getByTestId } = renderLoginScreen();

    const emailInput = getByTestId('login-email-input');
    const passwordInput = getByTestId('login-password-input');
    const demoButton = getByTestId('login-demo-button');

    fireEvent.changeText(emailInput, '');
    fireEvent.changeText(passwordInput, '');

    expect(emailInput.props.value).toBe('');

    fireEvent.press(demoButton);

    expect(emailInput.props.value).toBe('vineet@fieldtrack.dev');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('renders error message banner when authentication error is present', () => {
    const { getByTestId, getByText } = renderLoginScreen({
      auth: {
        user: null,
        token: null,
        status: 'error',
        error: 'Invalid email or password',
      },
    });

    expect(getByTestId('login-error-banner')).toBeTruthy();
    expect(getByText('Invalid email or password')).toBeTruthy();
  });
});
