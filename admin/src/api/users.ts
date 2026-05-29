import client from './client';

export const usersApi = {
  getAll: () => client.get('/users'),
  count: () => client.get('/users/count'),
  deleteOne: (id: number) => client.delete(`/users/${id}`),
  deleteMany: (ids: number[]) => client.delete('/users', { data: { ids } }),
  importCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return client.post('/users/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
