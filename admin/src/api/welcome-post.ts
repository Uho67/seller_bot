import client from './client';

export const welcomePostApi = {
  get: () => client.get('/welcome-post'),
  update: (data: FormData) => client.patch('/welcome-post', data),
};
