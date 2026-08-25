import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, imageUrl, trackEvent } from '../api/client';
import { useBackButton } from '../telegram/useBackButton';
import { uk } from '../i18n/uk';
import { OrderButton } from '../components/OrderButton';

export function Categories() {
  const navigate = useNavigate();
  useBackButton(useCallback(() => navigate(-1), [navigate]));
  useEffect(() => { trackEvent('page_open', 'categories'); }, []);

  const { data } = useQuery({ queryKey: ['categories'], queryFn: api.getCategories });

  const cats = (data ?? []).filter((c) => c.is_enabled && c.type !== 'catalog' && c.type !== 'all_products');

  return (
    <div className="page">
      <h1 className="page-title">{uk.screens.categories}</h1>
      {cats.length === 0 ? (
        <div className="empty">{uk.empty.category}</div>
      ) : (
        <div className="list">
          {cats.map((c) => {
            const img = imageUrl(c.image);
            return (
              <button key={c.id} className="list-row" onClick={() => { trackEvent('category_click', c.name); navigate(`/categories/${c.id}`); }}>
                {img && <img src={img} alt="" loading="lazy" />}
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      )}
      <OrderButton />
    </div>
  );
}
