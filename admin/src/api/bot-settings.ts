import client from './client';

export const botSettingsApi = {
  get: () => client.get('/buttons/bot-settings'),
  update: (data: any) => client.patch('/buttons/bot-settings', data),
};
