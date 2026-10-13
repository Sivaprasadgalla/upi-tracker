import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production Deployed Backend on Render
const PRODUCTION_API_URL = 'https://upi-tracker-r7mk.onrender.com/api';

const getBackendUrl = (): string => {
  // 1. Explicit environment variable override if specified
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // 2. Production deployed backend default
  return PRODUCTION_API_URL;
};

export const api = axios.create({
  baseURL: getBackendUrl(),
  timeout: 60000, // 60s timeout to safely accommodate Render free-tier cold starts
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-retry on Render cold starts (timeouts, 502, 503, 504)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    if (!config || (config as any).__retryCount >= 2) {
      return Promise.reject(error);
    }

    const isTimeout = error.code === 'ECONNABORTED' || (typeof error.message === 'string' && error.message.includes('timeout'));
    const isServerWaking = !error.response || [502, 503, 504].includes(error.response?.status);

    if (isTimeout || isServerWaking) {
      (config as any).__retryCount = ((config as any).__retryCount || 0) + 1;
      console.log(`[API] Retrying request (attempt ${(config as any).__retryCount}) to allow backend to wake up...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return api(config);
    }

    return Promise.reject(error);
  }
);
