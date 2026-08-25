import client from './client';

export const shippingPostApi = {
  get: () => client.get('/shipping-post'),
  update: (data: FormData) => client.patch('/shipping-post', data),
  toggle: () => client.patch('/shipping-post/toggle'),
};
