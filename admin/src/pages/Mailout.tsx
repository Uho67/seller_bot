import { useState } from 'react';
import {
  Form, Select, Button, Card, Table, Tag, message, Typography, Radio, Space, Popconfirm,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mailoutApi } from '../api/mailout';
import { productsApi } from '../api/products';
import { usersApi } from '../api/users';

const POST_TYPE_OPTIONS = [
  { label: 'Товар', value: 'product' },
  { label: 'Акция', value: 'sale' },
  { label: 'Welcome', value: 'welcome' },
];

const STATUS_OPTIONS = [
  { label: 'Ожидает', value: 'false' },
  { label: 'Отправлено', value: 'true' },
];

export function MailoutPage() {
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [postType, setPostType] = useState<string>('product');
  const [recipientMode, setRecipientMode] = useState<'all' | 'select'>('all');

  // Filters
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterPostId, setFilterPostId] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  // Row selection
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then((r) => r.data),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then((r) => r.data),
  });

  const filterParams = {
    post_type: filterType,
    post_id: filterPostId,
    is_sent: filterStatus != null ? filterStatus === 'true' : undefined,
  };

  const { data: mailouts = [], isLoading } = useQuery({
    queryKey: ['mailouts', filterParams],
    queryFn: () => mailoutApi.getAll(filterParams).then((r) => r.data),
  });

  const sendMutation = useMutation({
    mutationFn: async (values: any) => {
      const post_id = postType === 'product' ? values.post_id : 1;
      const chat_ids = recipientMode === 'all' ? 'all' : values.chat_ids;
      return mailoutApi.send({ post_id, post_type: postType, chat_ids });
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['mailouts'] });
      message.success(`Добавлено в очередь: ${r.data.queued}`);
    },
    onError: () => message.error('Ошибка'),
  });

  const deleteRecordsMutation = useMutation({
    mutationFn: (ids: number[]) => mailoutApi.deleteRecords(ids),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['mailouts'] });
      setSelectedRowKeys([]);
      message.success(`Удалено записей: ${r.data.deleted}`);
    },
    onError: () => message.error('Ошибка удаления'),
  });

  const unsendMessagesMutation = useMutation({
    mutationFn: (ids: number[]) => mailoutApi.unsendMessages(ids),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['mailouts'] });
      setSelectedRowKeys([]);
      message.success(`Удалено из Telegram: ${r.data.deleted}, не удалось: ${r.data.failed}`);
    },
    onError: () => message.error('Ошибка удаления из Telegram'),
  });

  const deleteAllRecordsMutation = useMutation({
    mutationFn: () => mailoutApi.deleteAllRecords(),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['mailouts'] });
      setSelectedRowKeys([]);
      message.success(`Удалено всех записей: ${r.data.deleted}`);
    },
    onError: () => message.error('Ошибка удаления всех записей'),
  });

  const unsendAllMessagesMutation = useMutation({
    mutationFn: () => mailoutApi.unsendAllMessages(),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['mailouts'] });
      setSelectedRowKeys([]);
      message.success(`Удалено из Telegram: ${r.data.deleted}, не удалось: ${r.data.failed}`);
    },
    onError: () => message.error('Ошибка удаления всех сообщений из Telegram'),
  });

  const handleSelectFiltered = () => {
    setSelectedRowKeys((mailouts as any[]).map((m) => m.id));
  };

  const mailoutColumns = [
    { title: 'Chat ID', dataIndex: 'chat_id', key: 'chat_id', width: 120 },
    {
      title: 'Тип', dataIndex: 'post_type', key: 'post_type', width: 90,
      render: (v: string) => POST_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v,
    },
    { title: 'Post ID', dataIndex: 'post_id', key: 'post_id', width: 80 },
    {
      title: 'Статус', dataIndex: 'is_sent', key: 'is_sent', width: 120,
      render: (v: boolean) => <Tag color={v ? 'green' : 'orange'}>{v ? 'Отправлено' : 'Ожидает'}</Tag>,
    },
    {
      title: 'Дата', dataIndex: 'created_at', key: 'created_at', width: 150,
      render: (v: string) => new Date(v).toLocaleString('ru-RU'),
    },
  ];

  const hasSelection = selectedRowKeys.length > 0;

  return (
    <div>
      <Typography.Title level={3}>Рассылка</Typography.Title>
      <Card title="Новая рассылка" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={(v) => sendMutation.mutate(v)}>
          <Form.Item label="Тип поста">
            <Select
              value={postType}
              onChange={setPostType}
              options={POST_TYPE_OPTIONS}
            />
          </Form.Item>
          {postType === 'product' && (
            <Form.Item name="post_id" label="Выберите товар" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={products.map((p: any) => ({ label: p.name, value: p.id }))}
              />
            </Form.Item>
          )}
          <Form.Item label="Получатели">
            <Radio.Group value={recipientMode} onChange={(e) => setRecipientMode(e.target.value)}>
              <Radio value="all">Все активные</Radio>
              <Radio value="select">Выбранные</Radio>
            </Radio.Group>
          </Form.Item>
          {recipientMode === 'select' && (
            <Form.Item name="chat_ids" label="Пользователи" rules={[{ required: true }]}>
              <Select
                mode="multiple"
                options={users.map((u: any) => ({
                  label: `${u.first_name || ''} ${u.last_name || ''} (${u.chat_id})`.trim(),
                  value: u.chat_id,
                }))}
              />
            </Form.Item>
          )}
          <Button type="primary" htmlType="submit" loading={sendMutation.isPending} block>
            Отправить
          </Button>
        </Form>
      </Card>

      <Typography.Title level={4}>История рассылок</Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            allowClear
            placeholder="Тип"
            style={{ width: 130 }}
            options={POST_TYPE_OPTIONS}
            value={filterType}
            onChange={(v) => { setFilterType(v); setSelectedRowKeys([]); }}
          />
          <Select
            allowClear
            placeholder="Post ID"
            style={{ width: 130 }}
            showSearch
            optionFilterProp="label"
            options={products.map((p: any) => ({ label: `#${p.id} ${p.name}`, value: p.id }))}
            value={filterPostId}
            onChange={(v) => { setFilterPostId(v); setSelectedRowKeys([]); }}
          />
          <Select
            allowClear
            placeholder="Статус"
            style={{ width: 140 }}
            options={STATUS_OPTIONS}
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setSelectedRowKeys([]); }}
          />
          <Button onClick={handleSelectFiltered} disabled={!(mailouts as any[]).length}>
            Выбрать отфильтрованные
          </Button>
          <Popconfirm
            title="Удалить ВСЕ записи из базы без фильтрации?"
            onConfirm={() => deleteAllRecordsMutation.mutate()}
            okText="Удалить всё"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
          >
            <Button danger loading={deleteAllRecordsMutation.isPending}>
              Очистить все записи
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Удалить ВСЕ сообщения из Telegram и очистить базу?"
            onConfirm={() => unsendAllMessagesMutation.mutate()}
            okText="Удалить всё"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
          >
            <Button danger loading={unsendAllMessagesMutation.isPending}>
              Удалить всё из Telegram
            </Button>
          </Popconfirm>
          {hasSelection && (
            <>
              <Typography.Text type="secondary">{selectedRowKeys.length} выбрано</Typography.Text>
              <Popconfirm
                title={`Удалить ${selectedRowKeys.length} записей из базы?`}
                onConfirm={() => deleteRecordsMutation.mutate(selectedRowKeys)}
                okText="Удалить"
                cancelText="Отмена"
              >
                <Button danger loading={deleteRecordsMutation.isPending}>
                  Очистить записи
                </Button>
              </Popconfirm>
              <Popconfirm
                title={`Удалить сообщения из Telegram для ${selectedRowKeys.length} записей?`}
                onConfirm={() => unsendMessagesMutation.mutate(selectedRowKeys)}
                okText="Удалить"
                cancelText="Отмена"
              >
                <Button danger loading={unsendMessagesMutation.isPending}>
                  Удалить из Telegram
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      </Card>

      <Table
        dataSource={mailouts as any[]}
        columns={mailoutColumns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        size="small"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as number[]),
        }}
      />
    </div>
  );
}
