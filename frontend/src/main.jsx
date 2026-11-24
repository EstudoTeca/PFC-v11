import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext.jsx'
import axios from 'axios'

// 🌐 URL da API em Produção (se configurada na Vercel)
const API_URL = import.meta.env.VITE_API_URL;

// Interceptor que substitui localhost pela URL da nuvem automaticamente
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Se estiver em produção ou servido pelo mesmo servidor, substitui localhost:5000 pela URL configurada ou caminho relativo
    if (config.url && config.url.includes('http://localhost:5000')) {
        config.url = config.url.replace('http://localhost:5000', API_URL || '');
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.clear();
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
)