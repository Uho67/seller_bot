import client from './client';

export const buttonsApi = {
  getAll: () => client.get('/buttons'),
  updateOrder: (data: any) => client.patch('/buttons/order', data),
  updateAdmin: (data: any) => client.patch('/buttons/admin-btn', data),
  updateMainMenu: (data: any) => client.patch('/buttons/main-menu', data),
  updateChannel: (data: any) => client.patch('/buttons/channel', data),
};
