import expenseReducer, {
  setExpenses,
  setExpenseFilters,
  createExpenseOffline,
  updateExpenseOffline,
  deleteExpenseOffline,
  calculateExpenseSummary,
} from '../../store/expenseSlice';
import { Expense } from '../../types/expense';

describe('expenseSlice', () => {
  const baseExpense: Expense = {
    id: 'exp_001',
    taskId: 'task_001',
    title: 'Fuel for transit',
    category: 'travel',
    amount: 50.0,
    currency: 'USD',
    receiptNote: 'Shell receipt',
    date: '2026-10-29',
    createdAt: 1000,
    updatedAt: 1000,
    userId: 'usr_1',
    isDirty: false,
  };

  it('handles setExpenses', () => {
    const state = expenseReducer(undefined, setExpenses([baseExpense]));
    expect(state.expenses).toHaveLength(1);
    expect(state.expenses[0].amount).toBe(50.0);
  });

  it('handles setExpenseFilters', () => {
    const state = expenseReducer(
      undefined,
      setExpenseFilters({ search: 'Fuel', category: 'travel' })
    );
    expect(state.filters.search).toBe('Fuel');
    expect(state.filters.category).toBe('travel');
  });

  it('handles createExpenseOffline.fulfilled', () => {
    const newExpense: Expense = {
      ...baseExpense,
      id: 'exp_002',
      title: 'Lunch',
      category: 'meals',
      amount: 25.5,
    };

    const state = expenseReducer(
      { expenses: [baseExpense], filters: { search: '', category: 'all', dateRange: 'all' }, isLoading: false, error: null },
      { type: createExpenseOffline.fulfilled.type, payload: newExpense }
    );

    expect(state.expenses).toHaveLength(2);
    expect(state.expenses[0].id).toBe('exp_002');
  });

  it('handles updateExpenseOffline.fulfilled', () => {
    const updated: Expense = {
      ...baseExpense,
      amount: 65.0,
      receiptNote: 'Shell receipt updated',
    };

    const state = expenseReducer(
      { expenses: [baseExpense], filters: { search: '', category: 'all', dateRange: 'all' }, isLoading: false, error: null },
      { type: updateExpenseOffline.fulfilled.type, payload: updated }
    );

    expect(state.expenses[0].amount).toBe(65.0);
  });

  it('handles deleteExpenseOffline.fulfilled', () => {
    const state = expenseReducer(
      { expenses: [baseExpense], filters: { search: '', category: 'all', dateRange: 'all' }, isLoading: false, error: null },
      { type: deleteExpenseOffline.fulfilled.type, payload: 'exp_001' }
    );

    expect(state.expenses).toHaveLength(0);
  });

  describe('calculateExpenseSummary', () => {
    it('accurately computes totals, counts, and category percentages', () => {
      const expenses: Expense[] = [
        { ...baseExpense, id: '1', category: 'travel', amount: 100 },
        { ...baseExpense, id: '2', category: 'meals', amount: 50 },
        { ...baseExpense, id: '3', category: 'equipment', amount: 50 },
      ];

      const summary = calculateExpenseSummary(expenses);

      expect(summary.totalAmount).toBe(200);
      expect(summary.totalCount).toBe(3);

      const travel = summary.categories.find((c) => c.category === 'travel')!;
      expect(travel.total).toBe(100);
      expect(travel.percentage).toBe(50.0);
      expect(travel.count).toBe(1);

      const meals = summary.categories.find((c) => c.category === 'meals')!;
      expect(meals.total).toBe(50);
      expect(meals.percentage).toBe(25.0);
      expect(meals.count).toBe(1);
    });

    it('handles empty expense list safely', () => {
      const summary = calculateExpenseSummary([]);
      expect(summary.totalAmount).toBe(0);
      expect(summary.totalCount).toBe(0);
      expect(summary.categories.every((c) => c.total === 0 && c.percentage === 0)).toBe(true);
    });
  });
});
