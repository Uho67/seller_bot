import { useState } from 'react';
import {
  Table, Tag, Typography, DatePicker, Select, Button, Space, Modal, Form, message,
  Row, Col, Input, Tabs, Upload, Popconfirm,
} from 'antd';
import { SendOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { usersApi } from '../api/users';
import { productsApi } from '../api/products';
import { mailoutApi } from '../api/mailout';

type ActiveFilter = 'all' | 'active' | 'inactive';

function UsersList() {
  const qc = useQueryClient();
  const [form] = Form.useForm();

  const [createdFrom, setCreatedFrom] = useState<Dayjs | null>(null);
  const [createdTo, setCreatedTo] = useState<Dayjs | null>(null);
  const [updatedBefore, setUpdatedBefore] = useState<Dayjs | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [postType, setPostType] = useState<string>('product');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then((r) => r.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then((r) => r.data),
  });

  const sendMutation = useMutation({
    mutationFn: async (values: any) => {
      const post_id = postType === 'product' ? values.post_id : 1;
      const chat_ids = filteredUsers.map((u: any) => u.chat_id);
      return mailoutApi.send({ post_id, post_type: postType, chat_ids });
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['mailouts'] });
      message.success(`В очереди: ${r.data.queued}`);
      setModalOpen(false);
      form.resetFields();
    },
    onError: () => message.error('Ошибка'),
  });

  const deleteOneMutation = useMutation({
    mutationFn: (id: number) => usersApi.deleteOne(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      message.success('Пользователь удалён');
    },
    onError: () => message.error('Ошибка удаления'),
  });

  const deleteManyMutation = useMutation({
    mutationFn: (ids: number[]) => usersApi.deleteMany(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setSelectedIds([]);
      message.success('Пользователи удалены');
    },
    onError: () => message.error('Ошибка удаления'),
  });

  const filteredUsers = users.filter((u: any) => {
    if (activeFilter === 'active' && !u.is_active) return false;
    if (activeFilter === 'inactive' && u.is_active) return false;
    if (createdFrom && dayjs(u.created_at).isBefore(createdFrom.startOf('day'))) return false;
    if (createdTo && dayjs(u.created_at).isAfter(createdTo.endOf('day'))) return false;
    if (updatedBefore && !dayjs(u.updated_at).isBefore(updatedBefore.startOf('day'))) return false;
    if (usernameFilter && !(u.user_name ?? '').toLowerCase().includes(usernameFilter.toLowerCase())) return false;
    return true;
  });

  const columns = [
    { title: 'Chat ID', dataIndex: 'chat_id', key: 'chat_id', width: 110 },
    {
      title: 'Имя', dataIndex: 'first_name', key: 'first_name', minWidth: 100,
      render: (_: any, r: any) => [r.first_name, r.last_name].filter(Boolean).join(' ') || '—',
    },
    {
      title: 'Username', dataIndex: 'user_name', key: 'user_name', minWidth: 100,
      render: (v: string) => v ? `@${v}` : '—',
    },
    {
      title: 'Статус', dataIndex: 'is_active', key: 'is_active', width: 110,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Активный' : 'Заблокировал'}</Tag>,
    },
    {
      title: 'Зарегистрирован', dataIndex: 'created_at', key: 'created_at', width: 130,
      render: (v: string) => new Date(v).toLocaleDateString('ru-RU'),
    },
    {
      title: 'Обновлено', dataIndex: 'updated_at', key: 'updated_at', width: 110,
      render: (v: string) => new Date(v).toLocaleDateString('ru-RU'),
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_: any, r: any) => (
        <Popconfirm
          title="Удалить пользователя?"
          okText="Да"
          cancelText="Нет"
          okButtonProps={{ danger: true }}
          onConfirm={() => deleteOneMutation.mutate(r.id)}
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const hasFilters = activeFilter !== 'all' || createdFrom || createdTo || updatedBefore || usernameFilter;

  const confirmDeleteMany = () => {
    Modal.confirm({
      title: `Удалить ${selectedIds.length} пользователей?`,
      content: 'Это действие нельзя отменить.',
      okText: 'Удалить',
      okButtonProps: { danger: true },
      cancelText: 'Отмена',
      onOk: () => deleteManyMutation.mutate(selectedIds),
    });
  };

  const confirmDeleteAll = () => {
    Modal.confirm({
      title: `Удалить всех ${filteredUsers.length} пользователей?`,
      content: 'Это действие нельзя отменить.',
      okText: 'Удалить всех',
      okButtonProps: { danger: true },
      cancelText: 'Отмена',
      onOk: () => deleteManyMutation.mutate(filteredUsers.map((u: any) => u.id)),
    });
  };

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }} align="bottom">
        <Col>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Статус</div>
          <Select
            value={activeFilter}
            onChange={setActiveFilter}
            style={{ width: 130 }}
            options={[
              { label: 'Все', value: 'all' },
              { label: 'Активные', value: 'active' },
              { label: 'Заблокированные', value: 'inactive' },
            ]}
          />
        </Col>
        <Col>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Дата регистрации от</div>
          <DatePicker value={createdFrom} onChange={setCreatedFrom} format="DD.MM.YYYY" placeholder="от" />
        </Col>
        <Col>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Дата регистрации до</div>
          <DatePicker value={createdTo} onChange={setCreatedTo} format="DD.MM.YYYY" placeholder="до" />
        </Col>
        <Col>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Обновлено до (неактивные)</div>
          <DatePicker value={updatedBefore} onChange={setUpdatedBefore} format="DD.MM.YYYY" placeholder="раньше чем" />
        </Col>
        <Col>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Username</div>
          <Input
            value={usernameFilter}
            onChange={(e) => setUsernameFilter(e.target.value)}
            placeholder="@username"
            allowClear
            style={{ width: 150 }}
          />
        </Col>
        <Col>
          {hasFilters && (
            <Button
              onClick={() => {
                setActiveFilter('all');
                setCreatedFrom(null);
                setCreatedTo(null);
                setUpdatedBefore(null);
                setUsernameFilter('');
              }}
            >
              Сбросить
            </Button>
          )}
        </Col>
      </Row>

      <Space style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary">{filteredUsers.length} пользователей</Typography.Text>
        <Button
          type="primary"
          icon={<SendOutlined />}
          disabled={filteredUsers.length === 0}
          onClick={() => setModalOpen(true)}
        >
          Отправить отфильтрованным ({filteredUsers.length})
        </Button>
        {selectedIds.length > 0 && (
          <Button
            danger
            icon={<DeleteOutlined />}
            loading={deleteManyMutation.isPending}
            onClick={confirmDeleteMany}
          >
            Удалить выбранных ({selectedIds.length})
          </Button>
        )}
        <Button
          danger
          icon={<DeleteOutlined />}
          disabled={filteredUsers.length === 0}
          loading={deleteManyMutation.isPending}
          onClick={confirmDeleteAll}
        >
          Удалить всех ({filteredUsers.length})
        </Button>
      </Space>

      <Table
        dataSource={filteredUsers}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        size="small"
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as number[]),
        }}
      />

      <Modal
        title={`Отправить ${filteredUsers.length} пользователям`}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={(v) => sendMutation.mutate(v)}>
          <Form.Item label="Тип поста">
            <Select
              value={postType}
              onChange={(v) => { setPostType(v); form.resetFields(['post_id']); }}
              options={[
                { label: 'Товар', value: 'product' },
                { label: 'Акция', value: 'sale' },
                { label: 'Welcome', value: 'welcome' },
              ]}
            />
          </Form.Item>
          {postType === 'product' && (
            <Form.Item name="post_id" label="Выберите товар" rules={[{ required: true, message: 'Выберите товар' }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={products.map((p: any) => ({ label: p.name, value: p.id }))}
              />
            </Form.Item>
          )}
          <Button
            type="primary"
            htmlType="submit"
            loading={sendMutation.isPending}
            block
            icon={<SendOutlined />}
          >
            Отправить
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

function ImportTab() {
  const qc = useQueryClient();
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setResult(null);
    try {
      const r = await usersApi.importCsv(file);
      setResult(r.data);
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch {
      message.error('Ошибка импорта');
    } finally {
      setUploading(false);
    }
    return false;
  };

  return (
    <div style={{ maxWidth: 500 }}>
      {!result ? (
        <Upload.Dragger
          accept=".csv"
          showUploadList={false}
          beforeUpload={handleUpload}
          disabled={uploading}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Нажмите или перетащите CSV файл</p>
          <p className="ant-upload-hint">Формат: id, name, username, chat_id, status, ...</p>
        </Upload.Dragger>
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>Импорт завершён</Typography.Title>
          <Typography.Text>Добавлено: <strong>{result.inserted}</strong></Typography.Text>
          <Typography.Text>Пропущено (дубликаты): <strong>{result.skipped}</strong></Typography.Text>
          <Button onClick={() => setResult(null)}>Загрузить другой файл</Button>
        </Space>
      )}
    </div>
  );
}

export function UsersPage() {
  return (
    <div>
      <Typography.Title level={3}>Пользователи</Typography.Title>
      <Tabs
        defaultActiveKey="list"
        items={[
          { key: 'list', label: 'Список', children: <UsersList /> },
          { key: 'import', label: 'Импорт', children: <ImportTab /> },
        ]}
      />
    </div>
  );
}
