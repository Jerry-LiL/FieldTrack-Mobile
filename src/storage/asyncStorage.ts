import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/task';
import { Expense } from '../types/expense';

const TASKS_KEY = '@fieldtrack/tasks';
const EXPENSES_KEY = '@fieldtrack/expenses';

export async function loadTasksFromStorage(): Promise<Task[]> {
  try {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Task[];
  } catch (error) {
    console.warn('Failed to load tasks from local storage:', error);
    return [];
  }
}

export async function saveTasksToStorage(tasks: Task[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.warn('Failed to save tasks to local storage:', error);
  }
}

export async function loadExpensesFromStorage(): Promise<Expense[]> {
  try {
    const raw = await AsyncStorage.getItem(EXPENSES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Expense[];
  } catch (error) {
    console.warn('Failed to load expenses from local storage:', error);
    return [];
  }
}

export async function saveExpensesToStorage(expenses: Expense[]): Promise<void> {
  try {
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.warn('Failed to save expenses to local storage:', error);
  }
}

export async function clearAllLocalStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TASKS_KEY, EXPENSES_KEY]);
  } catch (error) {
    console.warn('Failed to clear local storage:', error);
  }
}
