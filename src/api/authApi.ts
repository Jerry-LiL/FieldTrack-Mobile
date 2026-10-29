import { request } from './client';
import { User } from '../types/auth';

export interface LoginResponse {
  token: string;
  user: User;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getProfileApi(): Promise<{ user: User }> {
  return request<{ user: User }>('/auth/me', {
    method: 'GET',
  });
}
