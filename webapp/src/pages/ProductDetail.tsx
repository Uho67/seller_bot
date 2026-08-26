import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { api, imageUrl, trackEvent } from '../api/client';
import { useBackButton } from '../telegram/useBackButton';
import { OrderButton } from '../components/OrderButton';

export function ProductDetail() {
  const navigate = useNavigate();
  useBackButton(useCallback(() => navigate(-1), [navigate]));
  const { id } = useParams();
  const productId = Number(id);
  useEffect(() => { trackEvent('page_open', 'product_detail'); }, []);

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.getProduct(productId),
    enabled: !isNaN(productId),
  });

  const img = imageUrl(product?.image);

  return (
    <div className="page">
      <div className="product-detail">
        {img && <img src={img} alt={product?.name} />}
        <h1>{product?.name}</h1>
        {product?.description && <div className="description">{product.description}</div>}
      </div>
      <OrderButton />
    </div>
  );
}
