import { useNavigate } from 'react-router-dom';
import { Product, imageUrl } from '../api/client';

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const img = imageUrl(product.image);
  return (
    <button className="product-card" onClick={() => navigate(`/products/${product.id}`)}>
      {img ? (
        <img className="product-card-img" src={img} alt={product.name} loading="lazy" />
      ) : (
        <div className="product-card-img" />
      )}
      <div className="product-card-body">{product.name}</div>
    </button>
  );
}
