import { useEffect } from 'react';
import { webApp } from './webApp';

export function useBackButton(handler: () => void) {
  useEffect(() => {
    const tg = webApp();
    if (!tg) return;
    tg.BackButton.show();
    tg.BackButton.onClick(handler);
    return () => {
      tg.BackButton.offClick(handler);
      tg.BackButton.hide();
    };
  }, [handler]);
}
