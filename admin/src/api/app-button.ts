import client from './client';

export const appButtonApi = {
  get: () => client.get('/app-button'),
  update: (data: any) => client.patch('/app-button', data),
};
