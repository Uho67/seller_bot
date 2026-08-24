import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appWelcomePostApi } from '../api/app-welcome-post';
import { ImageUpload } from '../components/ImageUpload';

export function AppWelcomePostPage() {
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: post } = useQuery({
    queryKey: ['app-welcome-post'],
    queryFn: () => appWelcomePostApi.get().then((r) => r.data),
  });

  useEffect(() => {
    if (post) form.setFieldsValue({ description: post.description });
  }, [post]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const fd = new FormData();
      if (values.description) fd.append('description', values.description);
      if (imageFile) fd.append('image', imageFile);
      return appWelcomePostApi.update(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app-welcome-post'] });
      message.success('Сохранено');
      setImageFile(null);
    },
    onError: () => message.error('Ошибка'),
  });

  return (
    <div>
      <Typography.Title level={3}>App Welcome Post</Typography.Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
          <Form.Item name="description" label="Текст приветствия">
            <Input.TextArea rows={5} />
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
