import { API_URL as API } from '../config';
import axios from 'axios';

export const AUTH_TOKEN_KEY = 'cysecsphere_token';
export const AUTH_USER_KEY = 'cysecsphere_user';

export const readStoredAuth = () => {
  const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
  const savedUser = localStorage.getItem(AUTH_USER_KEY);
  return savedToken && savedUser ? { savedToken, savedUser } : null;
};

export const persistAuth = (token, user) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const verifyAuthToken = (token) => axios.get(`${API}/api/auth/me`, {
  headers: { Authorization: `Bearer ${token}` },
});
