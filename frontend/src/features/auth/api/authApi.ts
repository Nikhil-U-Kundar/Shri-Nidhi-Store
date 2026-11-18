import { apiRequest } from '@/shared/api/client';
import type { ApiUser } from '@/entities/user';

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export const authApi = {
  login(login: string, password: string, role: 'customer' | 'admin'): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password, role }),
    });
  },

  register(name: string, phone: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone }),
    });
  },
};
