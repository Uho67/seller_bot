import client from './client';

export const usersApi = {
  getAll: () => client.get('/users'),
  count: () => client.get('/users/count'),
};
