import { apiRequest } from '@/shared/api';
import type { ApiUser } from './userApi';

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export const authApi = {
  login(login: string, password: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    });
  },

  register(name: string, phone: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone }),
    });
  },
};
