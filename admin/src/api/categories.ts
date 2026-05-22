import client from './client';

export const categoriesApi = {
  getAll: () => client.get('/categories'),
  create: (data: FormData) => client.post('/categories', data),
  update: (id: number, data: FormData) => client.patch(`/categories/${id}`, data),
  remove: (id: number) => client.delete(`/categories/${id}`),
};
