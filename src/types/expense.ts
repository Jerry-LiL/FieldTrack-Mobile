export type ExpenseCategory =
  | 'travel'
  | 'meals'
  | 'lodging'
  | 'equipment'
  | 'supplies'
  | 'other';

export interface Expense {
  id: string;
  taskId: string | null;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  receiptNote: string | null;
  date: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
  isDirty?: boolean;
}

export interface ExpenseSummaryCategory {
  category: ExpenseCategory;
  total: number;
  count: number;
  percentage: number;
}

export interface ExpenseSummary {
  totalAmount: number;
  totalCount: number;
  categories: ExpenseSummaryCategory[];
}

export interface ExpenseFilters {
  search: string;
  category: ExpenseCategory | 'all';
  dateRange: 'all' | 'this_month' | 'this_week';
}
