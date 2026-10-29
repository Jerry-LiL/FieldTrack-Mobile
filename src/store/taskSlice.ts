import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskFilters } from '../types/task';
import { syncQueue } from '../sync/syncQueue';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
} from '../storage/asyncStorage';
import { generateId } from '../utils/id';
import { generateSeedTasks } from '../utils/seedData';
import { refreshPendingCount } from './syncSlice';

interface TaskState {
  tasks: Task[];
  filters: TaskFilters;
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  filters: {
    search: '',
    status: 'all',
    priority: 'all',
  },
  isLoading: false,
  error: null,
};

export const loadTasksFromDisk = createAsyncThunk(
  'tasks/loadFromDisk',
  async () => {
    return await loadTasksFromStorage();
  }
);

export const createTaskOffline = createAsyncThunk<
  Task,
  Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isDirty'> & { id?: string },
  { state: { tasks: TaskState } }
>('tasks/createOffline', async (taskData, { getState, dispatch }) => {
  const now = Date.now();
  const newTask: Task = {
    ...taskData,
    id: taskData.id || generateId('task'),
    createdAt: now,
    updatedAt: now,
    isDirty: true,
  };

  const currentTasks = [newTask, ...getState().tasks.tasks];
  await saveTasksToStorage(currentTasks);
  await syncQueue.enqueue('task', 'CREATE', newTask.id, newTask, now);
  dispatch(refreshPendingCount());

  return newTask;
});

export const updateTaskOffline = createAsyncThunk<
  Task,
  { id: string; updates: Partial<Task> },
  { state: { tasks: TaskState } }
>('tasks/updateOffline', async ({ id, updates }, { getState, dispatch }) => {
  const now = Date.now();
  const currentTasks = getState().tasks.tasks;
  const existingIndex = currentTasks.findIndex((t) => t.id === id);

  if (existingIndex === -1) {
    throw new Error('Task not found');
  }

  const updatedTask: Task = {
    ...currentTasks[existingIndex],
    ...updates,
    id,
    updatedAt: now,
    isDirty: true,
  };

  const newTaskList = [...currentTasks];
  newTaskList[existingIndex] = updatedTask;

  await saveTasksToStorage(newTaskList);
  await syncQueue.enqueue('task', 'UPDATE', id, updates, now);
  dispatch(refreshPendingCount());

  return updatedTask;
});

export const deleteTaskOffline = createAsyncThunk<
  string,
  string,
  { state: { tasks: TaskState } }
>('tasks/deleteOffline', async (id, { getState, dispatch }) => {
  const now = Date.now();
  const currentTasks = getState().tasks.tasks.filter((t) => t.id !== id);

  await saveTasksToStorage(currentTasks);
  await syncQueue.enqueue('task', 'DELETE', id, {}, now);
  dispatch(refreshPendingCount());

  return id;
});

export const seedTasksBenchmark = createAsyncThunk<
  Task[],
  number,
  { state: { tasks: TaskState } }
>('tasks/seedBenchmark', async (count = 1000) => {
  const seeded = generateSeedTasks(count);
  await saveTasksToStorage(seeded);
  return seeded;
});

export const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
    setTaskFilters: (state, action: PayloadAction<Partial<TaskFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetTaskFilters: (state) => {
      state.filters = {
        search: '',
        status: 'all',
        priority: 'all',
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Load
      .addCase(loadTasksFromDisk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadTasksFromDisk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(loadTasksFromDisk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load tasks';
      })
      // Create
      .addCase(createTaskOffline.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        } else {
          state.tasks.unshift(action.payload);
        }
      })
      // Update
      .addCase(updateTaskOffline.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      // Delete
      .addCase(deleteTaskOffline.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
      })
      // Seed Benchmark
      .addCase(seedTasksBenchmark.fulfilled, (state, action) => {
        state.tasks = action.payload;
      });
  },
});

export const { setTasks, setTaskFilters, resetTaskFilters } = taskSlice.actions;

export default taskSlice.reducer;
