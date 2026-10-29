import { Task } from '../types/task';
import { Expense } from '../types/expense';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  TaskDetail: { task: Task };
  TaskForm: { task?: Task };
  ExpenseForm: { expense?: Expense; initialTaskId?: string };
};

export type MainTabParamList = {
  TasksTab: undefined;
  ExpensesTab: undefined;
  SummaryTab: undefined;
  SyncTab: undefined;
};
