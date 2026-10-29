export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  password?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: number;
  updatedAt: number;
  userId: string;
}

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
}

export type MutationAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncMutation<T = any> {
  mutationId: string;
  entity: 'task' | 'expense';
  action: MutationAction;
  id: string;
  payload: Partial<T>;
  timestamp: number;
}

export interface SyncConflict<T = any> {
  id: string;
  clientTimestamp: number;
  serverTimestamp: number;
  serverRecord: T | null;
  resolution: 'server_wins' | 'client_wins';
}

export interface SyncResponse<T = any> {
  applied: string[];
  conflicts: SyncConflict<T>[];
  currentRecords: T[];
}
