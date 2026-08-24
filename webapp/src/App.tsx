import { Routes, Route } from 'react-router-dom';
import { AgeGate } from './components/AgeGate';
import { Home } from './pages/Home';
import { Categories } from './pages/Categories';
import { CategoryProducts } from './pages/CategoryProducts';
import { AllProducts } from './pages/AllProducts';
import { ProductDetail } from './pages/ProductDetail';
import { SalePost } from './pages/SalePost';

export default function App() {
  return (
    <AgeGate>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:id" element={<CategoryProducts />} />
        <Route path="/products" element={<AllProducts />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/sale" element={<SalePost />} />
      </Routes>
    </AgeGate>
  );
}
