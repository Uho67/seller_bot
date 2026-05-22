import client from './client';

export const mailoutApi = {
  getAll: (params?: { post_type?: string; post_id?: number; is_sent?: boolean }) =>
    client.get('/mailout', { params }),
  send: (data: { post_id: number; post_type: string; chat_ids: string[] | 'all' }) =>
    client.post('/mailout/send', data),
  deleteRecords: (ids: number[]) => client.delete('/mailout/records', { data: { ids } }),
  unsendMessages: (ids: number[]) => client.delete('/mailout/messages', { data: { ids } }),
  deleteAllRecords: () => client.delete('/mailout/records/all'),
  unsendAllMessages: () => client.delete('/mailout/messages/all'),
};
