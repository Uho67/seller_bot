export function installTelegramMock() {
  if (!import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;
  if (window.Telegram?.WebApp) return;

  const listeners: Array<() => void> = [];
  window.Telegram = {
    WebApp: {
      initData: '',
      initDataUnsafe: {},
      themeParams: {
        bg_color: '#ffffff',
        text_color: '#1c1c1e',
        hint_color: '#8e8e93',
        link_color: '#2481cc',
        button_color: '#2481cc',
        button_text_color: '#ffffff',
        secondary_bg_color: '#f2f2f7',
      },
      colorScheme: 'light',
      ready() { console.log('[tg-mock] ready'); },
      expand() { console.log('[tg-mock] expand'); },
      close() { console.log('[tg-mock] close'); },
      openLink(url) { console.log('[tg-mock] openLink', url); window.open(url, '_blank'); },
      openTelegramLink(url) { console.log('[tg-mock] openTelegramLink', url); window.open(url, '_blank'); },
      BackButton: {
        show() { console.log('[tg-mock] BackButton.show'); },
        hide() { console.log('[tg-mock] BackButton.hide'); },
        onClick(cb) { listeners.push(cb); },
        offClick(cb) {
          const idx = listeners.indexOf(cb);
          if (idx >= 0) listeners.splice(idx, 1);
        },
      },
    },
  };
}
