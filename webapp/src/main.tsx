import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { installTelegramMock } from './telegram/mock';
import { initWebApp, webApp } from './telegram/webApp';
import { postSession } from './api/client';
import './styles/theme.css';

installTelegramMock();
initWebApp();

const initData = webApp()?.initData;
if (initData) {
  postSession(initData).catch(() => {});
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
