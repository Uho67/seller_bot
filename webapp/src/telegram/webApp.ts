interface ThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: { id: number; first_name?: string; last_name?: string; username?: string } };
  themeParams: ThemeParams;
  colorScheme: 'light' | 'dark';
  platform: string;
  ready(): void;
  expand(): void;
  close(): void;
  openLink(url: string, opts?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  BackButton: {
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export function webApp(): TgWebApp | undefined {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
}

export function initWebApp() {
  const tg = webApp();
  if (!tg) return;
  tg.ready();
  tg.expand();
  applyTheme(tg.themeParams, tg.colorScheme);
}

function applyTheme(theme: ThemeParams, scheme: 'light' | 'dark') {
  const root = document.documentElement;
  const set = (name: string, value?: string) => {
    if (value) root.style.setProperty(name, value);
  };
  set('--tg-bg', theme.bg_color);
  set('--tg-text', theme.text_color);
  set('--tg-hint', theme.hint_color);
  set('--tg-link', theme.link_color);
  set('--tg-button', theme.button_color);
  set('--tg-button-text', theme.button_text_color);
  set('--tg-secondary-bg', theme.secondary_bg_color);
  root.dataset.tgScheme = scheme;
}

export function openLink(url: string) {
  const tg = webApp();
  if (!tg) {
    window.open(url, '_blank');
    return;
  }
  if (url.startsWith('tg://')) {
    tg.openTelegramLink(url);
  } else if (url.startsWith('https://t.me/')) {
    // Telegram Desktop doesn't handle openTelegramLink reliably for t.me links;
    // opening via the browser lets the OS protocol handler pick it up instead.
    if (tg.platform === 'tdesktop') {
      tg.openLink(url);
    } else {
      tg.openTelegramLink(url);
    }
  } else {
    tg.openLink(url);
  }
}
