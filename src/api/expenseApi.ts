import { request } from './client';
import { Expense } from '../types/expense';
import { SyncMutation, SyncBatchResponse } from '../types/sync';

export async function fetchExpensesApi(): Promise<{ expenses: Expense[] }> {
  return request<{ expenses: Expense[] }>('/expenses', { method: 'GET' });
}

export async function createExpenseApi(expense: Partial<Expense>): Promise<{ expense: Expense }> {
  return request<{ expense: Expense }>('/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

export async function updateExpenseApi(
  id: string,
  updates: Partial<Expense>
): Promise<{ expense: Expense }> {
  return request<{ expense: Expense }>(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteExpenseApi(
  id: string,
  timestamp = Date.now()
): Promise<{ success: boolean; id: string }> {
  return request<{ success: boolean; id: string }>(`/expenses/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ timestamp }),
  });
}

export async function syncExpensesBatchApi(
  mutations: SyncMutation<Expense>[]
): Promise<SyncBatchResponse<Expense>> {
  return request<SyncBatchResponse<Expense>>('/expenses/sync', {
    method: 'POST',
    body: JSON.stringify({ mutations }),
  });
}
