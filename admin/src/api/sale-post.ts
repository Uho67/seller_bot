import client from './client';

export const salePostApi = {
  get: () => client.get('/sale-post'),
  update: (data: FormData) => client.patch('/sale-post', data),
  toggle: () => client.patch('/sale-post/toggle'),
};
