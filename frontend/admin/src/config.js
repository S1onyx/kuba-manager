const defaultBackendUrl =
  typeof window !== 'undefined' && window.location?.origin?.startsWith('http')
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000';

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim().length > 0
    ? import.meta.env.VITE_BACKEND_URL
    : defaultBackendUrl;
