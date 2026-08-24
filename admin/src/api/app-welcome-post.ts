import client from './client';

export const appWelcomePostApi = {
  get: () => client.get('/app-welcome-post'),
  update: (data: FormData) => client.patch('/app-welcome-post', data),
};
