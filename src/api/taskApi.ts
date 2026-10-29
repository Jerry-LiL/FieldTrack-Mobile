import { request } from './client';
import { Task } from '../types/task';
import { SyncMutation, SyncBatchResponse } from '../types/sync';

export async function fetchTasksApi(): Promise<{ tasks: Task[] }> {
  return request<{ tasks: Task[] }>('/tasks', { method: 'GET' });
}

export async function createTaskApi(task: Partial<Task>): Promise<{ task: Task }> {
  return request<{ task: Task }>('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

export async function updateTaskApi(id: string, updates: Partial<Task>): Promise<{ task: Task }> {
  return request<{ task: Task }>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteTaskApi(id: string, timestamp = Date.now()): Promise<{ success: boolean; id: string }> {
  return request<{ success: boolean; id: string }>(`/tasks/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ timestamp }),
  });
}

export async function syncTasksBatchApi(
  mutations: SyncMutation<Task>[]
): Promise<SyncBatchResponse<Task>> {
  return request<SyncBatchResponse<Task>>('/tasks/sync', {
    method: 'POST',
    body: JSON.stringify({ mutations }),
  });
}
