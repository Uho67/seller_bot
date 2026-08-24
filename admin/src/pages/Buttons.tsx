import { useEffect } from 'react';
import { Form, Input, Button, Card, Row, Col, message, Typography, Switch } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buttonsApi } from '../api/buttons';
import { extraButtonApi } from '../api/extra-button';
import { appButtonApi } from '../api/app-button';

export function ButtonsPage() {
  const qc = useQueryClient();

  const { data: buttons } = useQuery({
    queryKey: ['buttons'],
    queryFn: () => buttonsApi.getAll().then((r) => r.data),
  });

  const { data: extra } = useQuery({
    queryKey: ['extra-button'],
    queryFn: () => extraButtonApi.get().then((r) => r.data),
  });

  const { data: appButton } = useQuery({
    queryKey: ['app-button'],
    queryFn: () => appButtonApi.get().then((r) => r.data),
  });

  const [orderForm] = Form.useForm();
  const [adminForm] = Form.useForm();
  const [mainMenuForm] = Form.useForm();
  const [channelForm] = Form.useForm();
  const [extraForm] = Form.useForm();
  const [appButtonForm] = Form.useForm();

  useEffect(() => {
    if (!buttons) return;
    orderForm.setFieldsValue(buttons.order);
    adminForm.setFieldsValue(buttons.admin);
    mainMenuForm.setFieldsValue(buttons.mainMenu);
    channelForm.setFieldsValue(buttons.channel);
  }, [buttons]);

  useEffect(() => {
    if (extra) extraForm.setFieldsValue(extra);
  }, [extra]);

  useEffect(() => {
    if (appButton) appButtonForm.setFieldsValue(appButton);
  }, [appButton]);

  const makeMutation = (fn: (d: any) => Promise<any>, queryKey: string[]) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => { qc.invalidateQueries({ queryKey }); message.success('Сохранено'); },
      onError: () => message.error('Ошибка'),
    });

  const orderMut = makeMutation(buttonsApi.updateOrder, ['buttons']);
  const adminMut = makeMutation(buttonsApi.updateAdmin, ['buttons']);
  const mainMenuMut = makeMutation(buttonsApi.updateMainMenu, ['buttons']);
  const channelMut = makeMutation(buttonsApi.updateChannel, ['buttons']);
  const extraMut = makeMutation(extraButtonApi.update, ['extra-button']);
  const appButtonMut = makeMutation(appButtonApi.update, ['app-button']);

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
              <Typography.Title level={5} style={{ marginTop: 12 }}>Кнопка «Бот» (webapp)</Typography.Title>
              <Form.Item name="bot_text" label="Текст"><Input placeholder="Бот" /></Form.Item>
              <Form.Item name="bot_url" label="URL"><Input placeholder="https://t.me/your_bot" /></Form.Item>
              <Form.Item name="bot_is_enabled" label="Включена" valuePropName="checked"><Switch /></Form.Item>
              <Button type="primary" htmlType="submit" loading={mainMenuMut.isPending} block>Сохранить</Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Extra кнопка (webapp)">
            <Form form={extraForm} layout="vertical" onFinish={(v) => extraMut.mutate(v)}>
              <Form.Item name="text" label="Текст"><Input /></Form.Item>
              <Form.Item name="url" label="URL"><Input placeholder="https://…" /></Form.Item>
              <Form.Item name="is_enabled" label="Включена" valuePropName="checked"><Switch /></Form.Item>
              <Button type="primary" htmlType="submit" loading={extraMut.isPending} block>Сохранить</Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Кнопка приложения (Reply)">
            <Form form={appButtonForm} layout="vertical" onFinish={(v) => appButtonMut.mutate(v)}>
              <Form.Item name="text" label="Текст"><Input /></Form.Item>
              <Form.Item name="url" label="URL"><Input placeholder="https://…" /></Form.Item>
              <Form.Item name="is_enabled" label="Включена" valuePropName="checked"><Switch /></Form.Item>
              <Button type="primary" htmlType="submit" loading={appButtonMut.isPending} block>Сохранить</Button>
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
