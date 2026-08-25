import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

export interface Category {
  id: number;
  name: string;
  image: string | null;
  description: string | null;
  type: string;
  is_enabled: boolean;
}

export interface Product {
  id: number;
  name: string;
  image: string | null;
  description: string | null;
  is_enabled: boolean;
  categories: Category[];
}

export interface WelcomePost {
  id: number;
  image: string | null;
  description: string | null;
}

export interface AppWelcomePost {
  id: number;
  image: string | null;
  description: string | null;
}

export interface SalePost {
  id: number;
  image: string | null;
  name: string | null;
  description: string | null;
  is_enabled: boolean;
}

export interface OrderButton {
  id: number;
  name: string;
  telegram_user_link: string | null;
  prefill_text: string | null;
}

export interface ChannelButton {
  id: number;
  name: string;
  channel_link: string | null;
}

export interface MainMenuButton {
  id: number;
  name: string;
  bot_text: string;
  bot_url: string;
  bot_is_enabled: boolean;
}

export interface ButtonsResponse {
  order: OrderButton;
  admin: any;
  mainMenu: MainMenuButton;
  channel: ChannelButton;
}

export const api = {
  getCategories: () => client.get<Category[]>('/categories').then((r) => r.data),
  getProducts: () => client.get<Product[]>('/products').then((r) => r.data),
  getProduct: (id: number) => client.get<Product>(`/products/${id}`).then((r) => r.data),
  getWelcomePost: () => client.get<WelcomePost>('/welcome-post').then((r) => r.data),
  getAppWelcomePost: () => client.get<AppWelcomePost>('/app-welcome-post').then((r) => r.data),
  getSalePost: () => client.get<SalePost>('/sale-post').then((r) => r.data),
  getButtons: () => client.get<ButtonsResponse>('/buttons').then((r) => r.data),
};

export function postSession(initData: string) {
  return client.post('/webapp/session', { initData });
}

export function trackEvent(event: string, label?: string): void {
  const chatId = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  client.post('/analytics/event', {
    event,
    label: label ?? null,
    chat_id: chatId ? String(chatId) : null,
  }).catch(() => {});
}

export function imageUrl(name: string | null | undefined): string | undefined {
  if (!name) return undefined;
  return `/uploads/${name}`;
}
