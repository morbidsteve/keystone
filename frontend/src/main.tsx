import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import './styles/responsive.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Handle GitHub Pages SPA redirect
function handleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (redirect) {
    params.delete('redirect');
    const remaining = params.toString();
    const newUrl = redirect + (remaining ? '?' + remaining : '');
    window.history.replaceState(null, '', newUrl);
  }
}
handleRedirect();

// Derive basename from <base> tag or VITE_BASE_PATH for GitHub Pages
const basename = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

// Register service worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[SW] Registration failed:', err);
    });
  });
}
