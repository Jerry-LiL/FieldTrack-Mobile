import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TaskListScreen } from '../../screens/TaskListScreen';
import authReducer from '../../store/authSlice';
import taskReducer from '../../store/taskSlice';
import expenseReducer from '../../store/expenseSlice';
import syncReducer from '../../store/syncSlice';
import { Task } from '../../types/task';
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

const mockTasks: Task[] = [
  {
    id: 'task_001',
    title: 'Inspect HVAC Rooftop',
    description: 'Compressor check',
    location: 'Sector 4',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-11-01',
    createdAt: 1000,
    updatedAt: 1000,
    userId: 'usr_1',
    isDirty: false,
  },
  {
    id: 'task_002',
    title: 'Calibrate Pressure Gauge',
    description: 'Alpha station test',
    location: 'Pump Station Alpha',
    priority: 'medium',
    status: 'pending',
    dueDate: '2026-11-05',
    createdAt: 2000,
    updatedAt: 2000,
    userId: 'usr_1',
    isDirty: false,
  },
  {
    id: 'task_003',
    title: 'Electrical Safety Audit',
    description: 'Breaker panels',
    location: 'Substation West',
    priority: 'low',
    status: 'completed',
    dueDate: '2026-11-10',
    createdAt: 3000,
    updatedAt: 3000,
    userId: 'usr_1',
    isDirty: false,
  },
];

function renderTaskListScreen(preloadedTasks: Task[] = mockTasks) {
  const preloadedState: Partial<RootState> = {
    tasks: {
      tasks: preloadedTasks,
      filters: { search: '', status: 'all', priority: 'all' },
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
      <TaskListScreen />
    </Provider>
  );
}

describe('TaskListScreen', () => {
  it('renders tasks and sync status bar', () => {
    const { getByText, getByTestId } = renderTaskListScreen();

    expect(getByTestId('sync-status-bar')).toBeTruthy();
    expect(getByText('Inspect HVAC Rooftop')).toBeTruthy();
    expect(getByText('Calibrate Pressure Gauge')).toBeTruthy();
  });

  it('filters task list by search query', () => {
    const { getByTestId, queryByText } = renderTaskListScreen();

    const searchInput = getByTestId('task-search-input');
    fireEvent.changeText(searchInput, 'Calibrate');

    expect(queryByText('Calibrate Pressure Gauge')).toBeTruthy();
    expect(queryByText('Inspect HVAC Rooftop')).toBeNull();
  });

  it('filters task list by status chip', () => {
    const { getByTestId, queryByText } = renderTaskListScreen();

    const completedChip = getByTestId('filter-chip-completed');
    fireEvent.press(completedChip);

    expect(queryByText('Electrical Safety Audit')).toBeTruthy();
    expect(queryByText('Inspect HVAC Rooftop')).toBeNull();
  });

  it('navigates to TaskDetail when a card is pressed', () => {
    const { getByTestId } = renderTaskListScreen();

    const card = getByTestId('task-card-task_001');
    fireEvent.press(card);

    expect(mockNavigate).toHaveBeenCalledWith('TaskDetail', {
      task: expect.objectContaining({ id: 'task_001' }),
    });
  });

  it('renders empty placeholder when no tasks match filter', () => {
    const { getByTestId } = renderTaskListScreen([]);

    expect(getByTestId('task-list-empty')).toBeTruthy();
  });
});
