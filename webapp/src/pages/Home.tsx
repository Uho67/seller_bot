import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, imageUrl } from '../api/client';
import { openLink } from '../telegram/webApp';
import { OrderButton } from '../components/OrderButton';
import { uk } from '../i18n/uk';

export function Home() {
  const navigate = useNavigate();

  const { data: welcome } = useQuery({ queryKey: ['app-welcome'], queryFn: api.getAppWelcomePost });
  const { data: sale } = useQuery({ queryKey: ['sale'], queryFn: api.getSalePost });
  const { data: buttons } = useQuery({ queryKey: ['buttons'], queryFn: api.getButtons });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.getCategories });

  const enabledCategories = (categories ?? []).filter(
    (c) => c.is_enabled && c.type !== 'catalog' && c.type !== 'all_products',
  );

  const welcomeImg = imageUrl(welcome?.image);
  const saleImg = imageUrl(sale?.image);
  const channelUrl = buttons?.channel?.channel_link;

  return (
    <div className="page">
      <div className="welcome">
        {welcomeImg && <img className="welcome-img" src={welcomeImg} alt="" />}
        {welcome?.description && <div dangerouslySetInnerHTML={{ __html: welcome.description }} />}
      </div>
      <div className="list">
        {sale?.is_enabled && (
          <button className="list-row list-row-centered list-row-sale" onClick={() => navigate('/sale')}>
            {saleImg && <img src={saleImg} alt="" loading="lazy" />}
            <span>{sale?.name || uk.home.tiles.sale}</span>
          </button>
        )}
        {enabledCategories.map((cat) => {
          const img = imageUrl(cat.image);
          return (
            <button key={cat.id} className="list-row" onClick={() => navigate(`/categories/${cat.id}`)}>
              {img && <img src={img} alt="" loading="lazy" />}
              <span>{cat.name}</span>
            </button>
          );
        })}
        {channelUrl && (
          <button className="list-row list-row-centered" onClick={() => openLink(channelUrl)}>
            <span>{buttons?.channel?.name || uk.home.tiles.channel}</span>
          </button>
        )}
      </div>
      <OrderButton />
    </div>
  );
}
