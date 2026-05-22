import { Form, Input, Button, Card, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../store/auth';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form] = Form.useForm();

  const onFinish = async (values: { name: string; password: string }) => {
    try {
      const res = await authApi.login(values.name, values.password);
      login(res.data.access_token);
      navigate('/');
    } catch {
      message.error('Неверный логин или пароль');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>Siga Bot Admin</Typography.Title>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item name="name" label="Логин" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="password" label="Пароль" rules={[{ required: true }]}>
            <Input.Password size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">Войти</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
