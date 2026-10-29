import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ExpenseSummaryScreen } from '../../screens/ExpenseSummaryScreen';
import authReducer from '../../store/authSlice';
import taskReducer from '../../store/taskSlice';
import expenseReducer from '../../store/expenseSlice';
import syncReducer from '../../store/syncSlice';
import { Expense } from '../../types/expense';
import { RootState } from '../../store';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
  };
});

const mockExpenses: Expense[] = [
  {
    id: 'exp_001',
    taskId: 'task_001',
    title: 'Replacement hydraulic filter',
    category: 'equipment',
    amount: 120.0,
    currency: 'USD',
    receiptNote: 'Grainger inv #401',
    date: '2026-10-25',
    createdAt: 1000,
    updatedAt: 1000,
    userId: 'usr_1',
  },
  {
    id: 'exp_002',
    taskId: null,
    title: 'Truck fuel for site transit',
    category: 'travel',
    amount: 80.0,
    currency: 'USD',
    receiptNote: 'Shell pump 3',
    date: '2026-10-26',
    createdAt: 2000,
    updatedAt: 2000,
    userId: 'usr_1',
  },
  {
    id: 'exp_003',
    taskId: null,
    title: 'Emergency shift team lunch',
    category: 'meals',
    amount: 50.0,
    currency: 'USD',
    receiptNote: 'Diner receipt',
    date: '2026-10-28',
    createdAt: 3000,
    updatedAt: 3000,
    userId: 'usr_1',
  },
];

function renderSummaryScreen(preloadedExpenses: Expense[] = mockExpenses) {
  const preloadedState: Partial<RootState> = {
    expenses: {
      expenses: preloadedExpenses,
      filters: { search: '', category: 'all', dateRange: 'all' },
      isLoading: false,
      error: null,
    },
    sync: {
      isOnline: true,
      status: 'synced',
      pendingCount: 0,
      lastSyncTime: Date.now(),
      lastError: null,
    },
  };

  const testStore = configureStore({
    reducer: {
      auth: authReducer,
      tasks: taskReducer,
      expenses: expenseReducer,
      sync: syncReducer,
    },
    preloadedState,
  } as any);

  return render(
    <Provider store={testStore}>
      <ExpenseSummaryScreen />
    </Provider>
  );
}

describe('ExpenseSummaryScreen', () => {
  it('renders total spending KPI and breakdown cards', () => {
    const { getByText, getByTestId } = renderSummaryScreen();

    // Total spending is 120 + 80 + 50 = $250.00
    expect(getByText('$250.00')).toBeTruthy();
    expect(getByText('3 logged expenses')).toBeTruthy();
    expect(getByTestId('expense-category-breakdown-card')).toBeTruthy();
  });

  it('renders progress items for each expense category', () => {
    const { getByTestId } = renderSummaryScreen();

    expect(getByTestId('category-summary-equipment')).toBeTruthy();
    expect(getByTestId('category-summary-travel')).toBeTruthy();
    expect(getByTestId('category-summary-meals')).toBeTruthy();
  });

  it('allows switching period filters', () => {
    const { getByTestId } = renderSummaryScreen();

    const monthFilter = getByTestId('summary-filter-this_month');
    fireEvent.press(monthFilter);

    // Should still render without crashing
    expect(getByTestId('expense-category-breakdown-card')).toBeTruthy();
  });

  it('renders shortcut button to log expense', () => {
    const { getByTestId } = renderSummaryScreen();

    const addBtn = getByTestId('summary-add-expense-button');
    fireEvent.press(addBtn);

    expect(mockNavigate).toHaveBeenCalledWith('ExpenseForm', {});
  });
});
