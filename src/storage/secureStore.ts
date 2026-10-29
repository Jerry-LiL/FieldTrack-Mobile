import * as SecureStore from 'expo-secure-store';
import { User } from '../types/auth';

const TOKEN_KEY = 'fieldtrack_jwt_token';
const USER_KEY = 'fieldtrack_user_data';

export async function saveAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.warn('Failed to save auth token to secure store:', error);
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to get auth token from secure store:', error);
    return null;
  }
}

export async function removeAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to remove auth token from secure store:', error);
  }
}

export async function saveAuthUser(user: User): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn('Failed to save auth user to secure store:', error);
  }
}

export async function getAuthUser(): Promise<User | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch (error) {
    console.warn('Failed to get auth user from secure store:', error);
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([removeAuthToken(), SecureStore.deleteItemAsync(USER_KEY).catch(() => {})]);
}
