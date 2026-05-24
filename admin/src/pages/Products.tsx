import { useState } from 'react';
import {
  Table, Button, Switch, Space, Modal, Form, Input, Select, message, Tag, Image, Typography, Grid,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import { ImageUpload } from '../components/ImageUpload';

const { useBreakpoint } = Grid;

export function Products() {
  const qc = useQueryClient();
  const screens = useBreakpoint();
  const [modal, setModal] = useState<{ open: boolean; record?: any }>({ open: false });
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const fd = new FormData();
      fd.append('name', values.name);
      if (values.description) fd.append('description', values.description);
      fd.append('is_enabled', String(values.is_enabled ?? true));
      if (values.order !== undefined) fd.append('order', String(values.order));
      if (values.categoryIds) fd.append('categoryIds', JSON.stringify(values.categoryIds));
      if (imageFile) fd.append('image', imageFile);
      return modal.record
        ? productsApi.update(modal.record.id, fd)
        : productsApi.create(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setModal({ open: false });
      setImageFile(null);
      message.success('Сохранено');
    },
    onError: () => message.error('Ошибка'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); message.success('Удалено'); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => productsApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const openCreate = () => { form.resetFields(); setImageFile(null); setModal({ open: true }); };
  const openEdit = (record: any) => {
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      is_enabled: record.is_enabled,
      order: record.order ?? 0,
      categoryIds: record.categories?.map((c: any) => c.id),
    });
    setImageFile(null);
    setModal({ open: true, record });
  };

  const catOptions = categories
    .filter((c: any) => c.type !== 'catalog')
    .map((c: any) => ({ label: c.name, value: c.id }));

  const columns = [
    {
      title: 'Фото', dataIndex: 'image', key: 'image', width: 70,
      render: (img: string) => img
        ? <Image src={`/uploads/${img}`} width={48} height={48} style={{ objectFit: 'cover' }} />
        : '—',
    },
    { title: 'Название', dataIndex: 'name', key: 'name', minWidth: 120 },
    { title: 'Порядок', dataIndex: 'order', key: 'order', width: 80 },
    {
      title: 'Категории', dataIndex: 'categories', key: 'categories', minWidth: 120,
      render: (cats: any[]) => cats?.map((c) => <Tag key={c.id}>{c.name}</Tag>),
    },
    {
      title: 'Активный', dataIndex: 'is_enabled', key: 'is_enabled', width: 90,
      render: (val: boolean, rec: any) => (
        <Switch checked={val} onChange={() => toggleMutation.mutate(rec.id)} />
      ),
    },
    {
      title: 'Действия', key: 'actions', width: 90,
      render: (_: any, rec: any) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(rec)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() =>
            Modal.confirm({ title: 'Удалить?', onOk: () => deleteMutation.mutate(rec.id) })
          } />
        </Space>
      ),
    },
  ];

  const isMobile = !screens.md;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Товары</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {isMobile ? 'Добавить' : 'Добавить товар'}
        </Button>
      </div>
      <Table
        dataSource={products}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        size="small"
      />
      <Modal
        title={modal.record ? 'Редактировать товар' : 'Новый товар'}
        open={modal.open}
        onCancel={() => setModal({ open: false })}
        onOk={() => form.submit()}
        okText="Сохранить"
        width={isMobile ? '100%' : 520}
        style={isMobile ? { top: 0, margin: 0, maxWidth: '100vw', paddingBottom: 0 } : undefined}
        styles={isMobile ? { body: { maxHeight: '75vh', overflowY: 'auto' } } : undefined}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMutation.mutate(v)}>
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="order" label="Порядок">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="categoryIds" label="Категории">
            <Select mode="multiple" options={catOptions} placeholder="Выберите категории" />
          </Form.Item>
          <Form.Item name="is_enabled" label="Активный" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item label="Фото">
            <ImageUpload currentImage={modal.record?.image} onChange={setImageFile} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
