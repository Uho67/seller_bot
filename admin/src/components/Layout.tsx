import { useState } from 'react';
import { Layout as AntLayout, Menu, Drawer, Button, Grid } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';
import {
  AppstoreOutlined, ShoppingOutlined, TagsOutlined, StarOutlined,
  GiftOutlined, SettingOutlined, TeamOutlined, MailOutlined, LogoutOutlined, MenuOutlined, BarChartOutlined,
} from '@ant-design/icons';

const { useBreakpoint } = Grid;
const { Sider, Content, Header } = AntLayout;

const menuItems = [
  { key: '/', icon: <AppstoreOutlined />, label: 'Дашборд' },
  { key: '/products', icon: <ShoppingOutlined />, label: 'Товары' },
  { key: '/categories', icon: <TagsOutlined />, label: 'Категории' },
  { key: '/welcome-post', icon: <StarOutlined />, label: 'Welcome Post (бот)' },
  { key: '/app-welcome-post', icon: <StarOutlined />, label: 'Welcome Post (App)' },
  { key: '/sale-post', icon: <GiftOutlined />, label: 'Акция' },
  { key: '/buttons', icon: <SettingOutlined />, label: 'Кнопки' },
  { key: '/users', icon: <TeamOutlined />, label: 'Пользователи' },
  { key: '/mailout', icon: <MailOutlined />, label: 'Рассылка' },
  { key: '/analytics', icon: <BarChartOutlined />, label: 'Аналітика' },
];

const logoutItem = [{ key: 'logout', icon: <LogoutOutlined />, label: 'Выйти' }];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const screens = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMobile = !screens.lg;

  const handleNav = ({ key }: { key: string }) => {
    navigate(key);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  if (isMobile) {
    return (
      <AntLayout style={{ minHeight: '100vh' }}>
        <Header
          style={{
            position: 'sticky', top: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 16px', background: '#001529',
          }}
        >
          <Button
            type="text"
            icon={<MenuOutlined style={{ color: '#fff', fontSize: 20 }} />}
            onClick={() => setDrawerOpen(true)}
            style={{ padding: 4 }}
          />
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>aromagood</span>
        </Header>
        <Drawer
          title={<span style={{ color: '#fff' }}>Меню</span>}
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          styles={{
            body: { padding: 0, background: '#001529', display: 'flex', flexDirection: 'column' },
            header: { background: '#001529', borderBottom: '1px solid #2a3a4a' },
          }}
          width={240}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Menu
              theme="dark"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={handleNav}
              style={{ border: 'none' }}
            />
            <Menu
              theme="dark"
              items={logoutItem}
              onClick={handleLogout}
              style={{ border: 'none' }}
            />
          </div>
        </Drawer>
        <Content style={{ padding: 16 }}>
          <Outlet />
        </Content>
      </AntLayout>
    );
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider theme="dark">
        <div style={{ color: '#fff', textAlign: 'center', padding: '16px', fontWeight: 'bold', fontSize: 16 }}>
          aromagood
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
        <Menu
          theme="dark"
          style={{ position: 'absolute', bottom: 0, width: '100%' }}
          items={logoutItem}
          onClick={() => { logout(); navigate('/login'); }}
        />
      </Sider>
      <AntLayout>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
