import { Card, Statistic, Row, Col, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { productsApi } from '../api/products';

export function Dashboard() {
  const { data: userCount } = useQuery({
    queryKey: ['user-count'],
    queryFn: () => usersApi.count().then((r) => r.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then((r) => r.data),
  });

  return (
    <div>
      <Typography.Title level={3}>Дашборд</Typography.Title>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Пользователей" value={userCount ?? '—'} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Товаров" value={products?.length ?? '—'} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Активных товаров"
              value={products?.filter((p: any) => p.is_enabled).length ?? '—'}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
