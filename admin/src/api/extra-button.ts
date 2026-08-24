import client from './client';

export const extraButtonApi = {
  get: () => client.get('/extra-button'),
  update: (data: any) => client.patch('/extra-button', data),
};
