import { useEffect } from 'react';
import { Form, Input, Button, Card, Row, Col, message, Typography } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buttonsApi } from '../api/buttons';

export function ButtonsPage() {
  const qc = useQueryClient();

  const { data: buttons } = useQuery({
    queryKey: ['buttons'],
    queryFn: () => buttonsApi.getAll().then((r) => r.data),
  });

  const [orderForm] = Form.useForm();
  const [adminForm] = Form.useForm();
  const [mainMenuForm] = Form.useForm();
  const [channelForm] = Form.useForm();

  useEffect(() => {
    if (!buttons) return;
    orderForm.setFieldsValue(buttons.order);
    adminForm.setFieldsValue(buttons.admin);
    mainMenuForm.setFieldsValue(buttons.mainMenu);
    channelForm.setFieldsValue(buttons.channel);
  }, [buttons]);

  const makeMutation = (fn: (d: any) => Promise<any>) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['buttons'] }); message.success('Сохранено'); },
      onError: () => message.error('Ошибка'),
    });

  const orderMut = makeMutation(buttonsApi.updateOrder);
  const adminMut = makeMutation(buttonsApi.updateAdmin);
  const mainMenuMut = makeMutation(buttonsApi.updateMainMenu);
  const channelMut = makeMutation(buttonsApi.updateChannel);

  return (
    <div>
      <Typography.Title level={3}>Кнопки</Typography.Title>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={12}>
          <Card title="Кнопка Заказать">
            <Form form={orderForm} layout="vertical" onFinish={(v) => orderMut.mutate(v)}>
              <Form.Item name="name" label="Название"><Input /></Form.Item>
              <Form.Item name="telegram_user_link" label="Ссылка на менеджера">
                <Input placeholder="https://t.me/username" />
              </Form.Item>
              <Form.Item name="prefill_text" label="Текст для заполнения"><Input /></Form.Item>
              <Button type="primary" htmlType="submit" loading={orderMut.isPending} block>Сохранить</Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Кнопка Админ">
            <Form form={adminForm} layout="vertical" onFinish={(v) => adminMut.mutate(v)}>
              <Form.Item name="name" label="Название"><Input /></Form.Item>
              <Form.Item name="telegram_user_link" label="Ссылка на администратора">
                <Input placeholder="https://t.me/admin" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={adminMut.isPending} block>Сохранить</Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Кнопка Главное меню">
            <Form form={mainMenuForm} layout="vertical" onFinish={(v) => mainMenuMut.mutate(v)}>
              <Form.Item name="name" label="Название"><Input /></Form.Item>
              <Button type="primary" htmlType="submit" loading={mainMenuMut.isPending} block>Сохранить</Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Кнопка На канал">
            <Form form={channelForm} layout="vertical" onFinish={(v) => channelMut.mutate(v)}>
              <Form.Item name="name" label="Название"><Input /></Form.Item>
              <Form.Item name="channel_link" label="Ссылка на канал">
                <Input placeholder="https://t.me/channel" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={channelMut.isPending} block>Сохранить</Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
