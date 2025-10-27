const defaultBackendUrl =
  typeof window !== 'undefined' && window.location?.origin?.startsWith('http')
    ? (() => {
        const { protocol, hostname, port } = window.location;
        const devPorts = new Set(['5173', '5174', '5175', '8081', '8082']);
        if (!port || port === '80' || port === '443') {
          return `${protocol}//${hostname}`;
        }
        if (devPorts.has(port)) {
          return `${protocol}//${hostname}:3000`;
        }
        return `${protocol}//${hostname}`;
      })()
    : 'http://localhost:3000';

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim().length > 0
    ? import.meta.env.VITE_BACKEND_URL
    : defaultBackendUrl;

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'kuba-manager';

const sanitizeTrimmed = (value) =>
  typeof value === 'string' ? value.split(/\r?\n/)[0].trim() : '';
const sanitizeRaw = (value) =>
  typeof value === 'string' ? value.split(/\r?\n/)[0] : '';

const envUsername = sanitizeTrimmed(import.meta.env.VITE_ADMIN_USERNAME);
const envPassword = sanitizeRaw(import.meta.env.VITE_ADMIN_PASSWORD);
const envSessionKey = sanitizeTrimmed(import.meta.env.VITE_ADMIN_SESSION_KEY);

export const ADMIN_AUTH = {
  username: envUsername && envUsername.length > 0 ? envUsername : DEFAULT_ADMIN_USERNAME,
  password: envPassword && envPassword.length > 0 ? envPassword : DEFAULT_ADMIN_PASSWORD
};

export const ADMIN_SESSION_KEY =
  envSessionKey && envSessionKey.length > 0
    ? envSessionKey
    : 'kuba-admin-session';
