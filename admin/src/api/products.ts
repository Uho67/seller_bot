import client from './client';

export const productsApi = {
  getAll: () => client.get('/products'),
  getById: (id: number) => client.get(`/products/${id}`),
  create: (data: FormData) => client.post('/products', data),
  update: (id: number, data: FormData) => client.patch(`/products/${id}`, data),
  remove: (id: number) => client.delete(`/products/${id}`),
  toggle: (id: number) => client.patch(`/products/${id}/toggle`),
};
