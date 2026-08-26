import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Popconfirm, Row, Table, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { analyticsApi, EventStat, DayStat } from '../api/analytics';

const { Title } = Typography;

const EVENT_LABELS: Record<string, string> = {
  page_open: 'Відкриття сторінки',
  order_click: 'Замовити',
  category_click: 'Категорія',
  sale_click: 'Акція',
  channel_click: 'Канал',
};

const PAGE_LABELS: Record<string, string> = {
  home: 'Головна',
  categories: 'Категорії',
  category_products: 'Товари категорії',
  all_products: 'Всі товари',
  product_detail: 'Товар',
  sale: 'Акція',
};

export function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: analyticsApi.getStats,
    refetchInterval: 30_000,
  });

  const handleClear = async () => {
    setClearing(true);
    await analyticsApi.clearAll();
    await queryClient.invalidateQueries({ queryKey: ['analytics-stats'] });
    setClearing(false);
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = data?.byDay.find((d) => d.date === today)?.count ?? 0;

  const eventColumns = [
    {
      title: 'Подія',
      dataIndex: 'event',
      key: 'event',
      render: (v: string) => EVENT_LABELS[v] ?? v,
    },
    {
      title: 'Мітка',
      dataIndex: 'label',
      key: 'label',
      render: (v: string | null) => (v ? PAGE_LABELS[v] ?? v : '—'),
    },
    {
      title: 'Кількість',
      dataIndex: 'count',
      key: 'count',
      defaultSortOrder: 'descend' as const,
      sorter: (a: EventStat, b: EventStat) => a.count - b.count,
    },
  ];

  const dayColumns = [
    { title: 'Дата', dataIndex: 'date', key: 'date' },
    { title: 'Подій', dataIndex: 'count', key: 'count' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Аналітика Webapp</Title>
        <Popconfirm
          title="Очистити всю аналітику?"
          description="Це видалить усі записані події безповоротно."
          okText="Так, очистити"
          cancelText="Скасувати"
          okButtonProps={{ danger: true }}
          onConfirm={handleClear}
        >
          <Button danger icon={<DeleteOutlined />} loading={clearing}>
            Очистити
          </Button>
        </Popconfirm>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold' }}>{data?.total ?? 0}</div>
              <div style={{ color: '#888' }}>Всього подій</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold' }}>{data?.uniqueUsers ?? 0}</div>
              <div style={{ color: '#888' }}>Унікальних користувачів</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 'bold' }}>{todayCount}</div>
              <div style={{ color: '#888' }}>Подій сьогодні</div>
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="По типах подій">
            <Table
              dataSource={data?.byEvent ?? []}
              columns={eventColumns}
              rowKey={(r) => `${r.event}-${r.label}`}
              loading={isLoading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="По днях (останні 30)">
            <Table
              dataSource={data?.byDay ?? []}
              columns={dayColumns}
              rowKey="date"
              loading={isLoading}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
