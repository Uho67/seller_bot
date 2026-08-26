import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, imageUrl, trackEvent } from '../api/client';
import { useBackButton } from '../telegram/useBackButton';
import { OrderButton } from '../components/OrderButton';

export function SalePost() {
  const navigate = useNavigate();
  useBackButton(useCallback(() => navigate(-1), [navigate]));
  useEffect(() => { trackEvent('page_open', 'sale'); }, []);

  const { data } = useQuery({ queryKey: ['sale'], queryFn: api.getSalePost });
  const img = imageUrl(data?.image);

  return (
    <div className="page">
      <div className="sale">
        {img && <img src={img} alt={data?.name ?? ''} />}
        {data?.name && <h1>{data.name}</h1>}
        {data?.description && <div className="description">{data.description}</div>}
      </div>
      <OrderButton />
    </div>
  );
}
