import client from './client';

export const authApi = {
  login: (name: string, password: string) =>
    client.post<{ access_token: string }>('/auth/login', { name, password }),
};
