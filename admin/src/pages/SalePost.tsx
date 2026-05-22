import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Switch, message, Typography, Space } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salePostApi } from '../api/sale-post';
import { ImageUpload } from '../components/ImageUpload';

export function SalePostPage() {
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: post } = useQuery({
    queryKey: ['sale-post'],
    queryFn: () => salePostApi.get().then((r) => r.data),
  });

  useEffect(() => {
    if (post) form.setFieldsValue({ name: post.name, description: post.description, is_enabled: post.is_enabled });
  }, [post]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const fd = new FormData();
      if (values.name) fd.append('name', values.name);
      if (values.description) fd.append('description', values.description);
      fd.append('is_enabled', String(values.is_enabled ?? false));
      if (imageFile) fd.append('image', imageFile);
      return salePostApi.update(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sale-post'] });
      message.success('Сохранено');
      setImageFile(null);
    },
    onError: () => message.error('Ошибка'),
  });

  const toggleMutation = useMutation({
    mutationFn: () => salePostApi.toggle(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sale-post'] }),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Акция</Typography.Title>
        <Space>
          <span>Активна:</span>
          <Switch
            checked={post?.is_enabled}
            onChange={() => toggleMutation.mutate()}
            loading={toggleMutation.isPending}
          />
        </Space>
      </div>
      <Card>
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
          <Form.Item name="name" label="Название кнопки" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="is_enabled" label="Активна" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Фото">
            <ImageUpload currentImage={post?.image} onChange={setImageFile} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending} block>
            Сохранить
          </Button>
        </Form>
      </Card>
    </div>
  );
}
