import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useBackButton } from '../telegram/useBackButton';
import { ProductCard } from '../components/ProductCard';
import { OrderButton } from '../components/OrderButton';
import { uk } from '../i18n/uk';

export function CategoryProducts() {
  const navigate = useNavigate();
  useBackButton(useCallback(() => navigate(-1), [navigate]));
  const { id } = useParams();
  const categoryId = Number(id);

  const { data: products } = useQuery({ queryKey: ['products'], queryFn: api.getProducts });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.getCategories });

  const category = categories?.find((c) => c.id === categoryId);
  const filtered = (products ?? []).filter((p) =>
    p.is_enabled && p.categories.some((c) => c.id === categoryId),
  );

  return (
    <div className="page">
      <h1 className="page-title">{category?.name ?? ''}</h1>
      {filtered.length === 0 ? (
        <div className="empty">{uk.empty.products}</div>
      ) : (
        <div className="product-grid">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
      <OrderButton />
    </div>
  );
}
