import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useBackButton } from '../telegram/useBackButton';
import { ProductCard } from '../components/ProductCard';
import { OrderButton } from '../components/OrderButton';
import { uk } from '../i18n/uk';

export function AllProducts() {
  const navigate = useNavigate();
  useBackButton(useCallback(() => navigate(-1), [navigate]));

  const { data: products } = useQuery({ queryKey: ['products'], queryFn: api.getProducts });
  const enabled = (products ?? []).filter((p) => p.is_enabled);

  return (
    <div className="page">
      <h1 className="page-title">{uk.screens.allProducts}</h1>
      {enabled.length === 0 ? (
        <div className="empty">{uk.empty.products}</div>
      ) : (
        <div className="product-grid">
          {enabled.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
      <OrderButton />
    </div>
  );
}
