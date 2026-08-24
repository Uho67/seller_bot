import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, imageUrl } from '../api/client';
import { openLink } from '../telegram/webApp';
import { OrderButton } from '../components/OrderButton';
import { uk } from '../i18n/uk';

interface Tile {
  key: string;
  label: string;
  action: () => void;
}

export function Home() {
  const navigate = useNavigate();

  const { data: welcome } = useQuery({ queryKey: ['app-welcome'], queryFn: api.getAppWelcomePost });
  const { data: sale } = useQuery({ queryKey: ['sale'], queryFn: api.getSalePost });
  const { data: buttons } = useQuery({ queryKey: ['buttons'], queryFn: api.getButtons });
  const { data: extra } = useQuery({ queryKey: ['extra-button'], queryFn: api.getExtraButton });

  const tiles: Tile[] = [
    { key: 'catalog', label: uk.home.tiles.catalog, action: () => navigate('/categories') },
    { key: 'all', label: uk.home.tiles.allProducts, action: () => navigate('/products') },
  ];

  if (sale?.is_enabled) {
    tiles.push({ key: 'sale', label: uk.home.tiles.sale, action: () => navigate('/sale') });
  }

  const channelUrl = buttons?.channel?.channel_link;
  if (channelUrl) {
    tiles.push({
      key: 'channel',
      label: buttons?.channel?.name || uk.home.tiles.channel,
      action: () => openLink(channelUrl),
    });
  }

  if (buttons?.mainMenu?.bot_is_enabled && buttons.mainMenu.bot_url) {
    tiles.push({
      key: 'bot',
      label: buttons.mainMenu.bot_text || uk.home.tiles.bot,
      action: () => openLink(buttons.mainMenu.bot_url),
    });
  }

  if (extra?.is_enabled && extra.url) {
    tiles.push({
      key: 'extra',
      label: extra.text || 'Extra',
      action: () => openLink(extra.url),
    });
  }

  const welcomeImg = imageUrl(welcome?.image);

  return (
    <div className="page">
      <div className="welcome">
        {welcomeImg && <img className="welcome-img" src={welcomeImg} alt="" />}
        {welcome?.description && <div dangerouslySetInnerHTML={{ __html: welcome.description }} />}
      </div>
      <div className="tile-grid">
        {tiles.map((t) => (
          <button key={t.key} className="tile" onClick={t.action}>{t.label}</button>
        ))}
      </div>
      <OrderButton />
    </div>
  );
}
