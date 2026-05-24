import { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Tag, Image, Typography, Grid } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categories';
import { ImageUpload } from '../components/ImageUpload';

const { useBreakpoint } = Grid;

const TYPE_LABELS: Record<string, string> = {
  catalog: 'Каталог', ridina: 'Ridina', pod: 'Pods', cartridzh: 'Cartr', custom: 'Custom',
};

export function Categories() {
  const qc = useQueryClient();
  const screens = useBreakpoint();
  const [modal, setModal] = useState<{ open: boolean; record?: any }>({ open: false });
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const fd = new FormData();
      fd.append('name', values.name);
      if (values.description) fd.append('description', values.description);
      if (values.order !== undefined) fd.append('order', String(values.order));
      if (imageFile) fd.append('image', imageFile);
      return modal.record
        ? categoriesApi.update(modal.record.id, fd)
        : categoriesApi.create(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setModal({ open: false });
      setImageFile(null);
      message.success('Сохранено');
    },
    onError: () => message.error('Ошибка'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); message.success('Удалено'); },
    onError: (e: any) => message.error(e.response?.data?.message || 'Ошибка'),
  });

  const openEdit = (record: any) => {
    form.setFieldsValue({ name: record.name, description: record.description, order: record.order ?? 0 });
    setImageFile(null);
    setModal({ open: true, record });
  };

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
      title: 'Тип', dataIndex: 'type', key: 'type', width: 100,
      render: (t: string) => <Tag color={t === 'custom' ? 'blue' : 'green'}>{TYPE_LABELS[t] || t}</Tag>,
    },
    {
      title: 'Действия', key: 'actions', width: 90,
      render: (_: any, rec: any) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(rec)} />
          {rec.type === 'custom' && (
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() =>
              Modal.confirm({ title: 'Удалить?', onOk: () => deleteMutation.mutate(rec.id) })
            } />
          )}
        </Space>
      ),
    },
  ];

  const isMobile = !screens.md;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Категории</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setImageFile(null); setModal({ open: true }); }}>
          {isMobile ? 'Добавить' : 'Новая категория'}
        </Button>
      </div>
      <Table
        dataSource={categories}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        size="small"
      />
      <Modal
        title={modal.record ? 'Редактировать категорию' : 'Новая категория'}
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
          <Form.Item label="Фото">
            <ImageUpload currentImage={modal.record?.image} onChange={setImageFile} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
