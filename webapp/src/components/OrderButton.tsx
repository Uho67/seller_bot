import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { openLink } from '../telegram/webApp';
import { uk } from '../i18n/uk';

export function OrderButton({ floating = true }: { floating?: boolean }) {
  const { data: buttons } = useQuery({
    queryKey: ['buttons'],
    queryFn: api.getButtons,
  });

  const url = buttons?.order?.telegram_user_link;
  const label = buttons?.order?.name || uk.home.order;
  const prefill = buttons?.order?.prefill_text;

  const onClick = () => {
    if (!url) return;
    const finalUrl = prefill
      ? `${url}${url.includes('?') ? '&' : '?'}text=${encodeURIComponent(prefill)}`
      : url;
    openLink(finalUrl);
  };

  const btn = (
    <button
      className="btn btn-success order-cta"
      onClick={onClick}
      disabled={!url}
    >
      {label}
    </button>
  );

  if (!floating) return btn;
  return <div className="order-cta-wrap">{btn}</div>;
}
