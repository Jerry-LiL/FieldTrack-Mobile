import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Expense,
  ExpenseFilters,
  ExpenseCategory,
  ExpenseSummary,
} from '../types/expense';
import { syncQueue } from '../sync/syncQueue';
import {
  loadExpensesFromStorage,
  saveExpensesToStorage,
} from '../storage/asyncStorage';
import { generateId } from '../utils/id';
import { generateSeedExpenses } from '../utils/seedData';
import { refreshPendingCount } from './syncSlice';

interface ExpenseState {
  expenses: Expense[];
  filters: ExpenseFilters;
  isLoading: boolean;
  error: string | null;
}

const initialState: ExpenseState = {
  expenses: [],
  filters: {
    search: '',
    category: 'all',
    dateRange: 'all',
  },
  isLoading: false,
  error: null,
};

export const loadExpensesFromDisk = createAsyncThunk(
  'expenses/loadFromDisk',
  async () => {
    return await loadExpensesFromStorage();
  }
);

export const createExpenseOffline = createAsyncThunk<
  Expense,
  Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'isDirty'> & { id?: string },
  { state: { expenses: ExpenseState } }
>('expenses/createOffline', async (expenseData, { getState, dispatch }) => {
  const now = Date.now();
  const newExpense: Expense = {
    ...expenseData,
    id: expenseData.id || generateId('exp'),
    createdAt: now,
    updatedAt: now,
    isDirty: true,
  };

  const currentExpenses = [newExpense, ...getState().expenses.expenses];
  await saveExpensesToStorage(currentExpenses);
  await syncQueue.enqueue('expense', 'CREATE', newExpense.id, newExpense, now);
  dispatch(refreshPendingCount());

  return newExpense;
});

export const updateExpenseOffline = createAsyncThunk<
  Expense,
  { id: string; updates: Partial<Expense> },
  { state: { expenses: ExpenseState } }
>('expenses/updateOffline', async ({ id, updates }, { getState, dispatch }) => {
  const now = Date.now();
  const currentExpenses = getState().expenses.expenses;
  const existingIndex = currentExpenses.findIndex((e) => e.id === id);

  if (existingIndex === -1) {
    throw new Error('Expense not found');
  }

  const updatedExpense: Expense = {
    ...currentExpenses[existingIndex],
    ...updates,
    id,
    updatedAt: now,
    isDirty: true,
  };

  const newExpenseList = [...currentExpenses];
  newExpenseList[existingIndex] = updatedExpense;

  await saveExpensesToStorage(newExpenseList);
  await syncQueue.enqueue('expense', 'UPDATE', id, updates, now);
  dispatch(refreshPendingCount());

  return updatedExpense;
});

export const deleteExpenseOffline = createAsyncThunk<
  string,
  string,
  { state: { expenses: ExpenseState } }
>('expenses/deleteOffline', async (id, { getState, dispatch }) => {
  const now = Date.now();
  const currentExpenses = getState().expenses.expenses.filter((e) => e.id !== id);

  await saveExpensesToStorage(currentExpenses);
  await syncQueue.enqueue('expense', 'DELETE', id, {}, now);
  dispatch(refreshPendingCount());

  return id;
});

export const seedExpensesBenchmark = createAsyncThunk<
  Expense[],
  number,
  { state: { expenses: ExpenseState } }
>('expenses/seedBenchmark', async (count = 500) => {
  const seeded = generateSeedExpenses(count);
  await saveExpensesToStorage(seeded);
  return seeded;
});

export const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setExpenses: (state, action: PayloadAction<Expense[]>) => {
      state.expenses = action.payload;
    },
    setExpenseFilters: (state, action: PayloadAction<Partial<ExpenseFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetExpenseFilters: (state) => {
      state.filters = {
        search: '',
        category: 'all',
        dateRange: 'all',
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Load
      .addCase(loadExpensesFromDisk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadExpensesFromDisk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses = action.payload;
      })
      .addCase(loadExpensesFromDisk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load expenses';
      })
      // Create
      .addCase(createExpenseOffline.fulfilled, (state, action) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        } else {
          state.expenses.unshift(action.payload);
        }
      })
      // Update
      .addCase(updateExpenseOffline.fulfilled, (state, action) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      })
      // Delete
      .addCase(deleteExpenseOffline.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter((e) => e.id !== action.payload);
      })
      // Seed
      .addCase(seedExpensesBenchmark.fulfilled, (state, action) => {
        state.expenses = action.payload;
      });
  },
});

export const { setExpenses, setExpenseFilters, resetExpenseFilters } = expenseSlice.actions;

// Selector helper for financial summary
export function calculateExpenseSummary(expenses: Expense[]): ExpenseSummary {
  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalCount = expenses.length;

  const categoryMap = new Map<ExpenseCategory, { total: number; count: number }>();
  const categories: ExpenseCategory[] = [
    'travel',
    'meals',
    'lodging',
    'equipment',
    'supplies',
    'other',
  ];

  for (const c of categories) {
    categoryMap.set(c, { total: 0, count: 0 });
  }

  for (const e of expenses) {
    const current = categoryMap.get(e.category) || { total: 0, count: 0 };
    current.total += e.amount || 0;
    current.count += 1;
    categoryMap.set(e.category, current);
  }

  const categorySummaries = categories.map((cat) => {
    const data = categoryMap.get(cat)!;
    const percentage = totalAmount > 0 ? (data.total / totalAmount) * 100 : 0;
    return {
      category: cat,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      percentage: Math.round(percentage * 10) / 10,
    };
  });

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalCount,
    categories: categorySummaries,
  };
}

export default expenseSlice.reducer;
