import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ukUA from 'antd/locale/uk_UA';
import { AuthProvider } from './store/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Categories } from './pages/Categories';
import { WelcomePostPage } from './pages/WelcomePost';
import { AppWelcomePostPage } from './pages/AppWelcomePost';
import { SalePostPage } from './pages/SalePost';
import { ShippingPostPage } from './pages/ShippingPost';
import { ButtonsPage } from './pages/Buttons';
import { UsersPage } from './pages/Users';
import { MailoutPage } from './pages/Mailout';
import { AnalyticsPage } from './pages/Analytics';

export default function App() {
  return (
    <ConfigProvider locale={ukUA}>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || '/aromagood'}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="welcome-post" element={<WelcomePostPage />} />
              <Route path="app-welcome-post" element={<AppWelcomePostPage />} />
              <Route path="sale-post" element={<SalePostPage />} />
              <Route path="shipping-post" element={<ShippingPostPage />} />
              <Route path="buttons" element={<ButtonsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="mailout" element={<MailoutPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
