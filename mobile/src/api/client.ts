import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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
  timeout: 25000, // 25s timeout to gracefully accommodate Render cold starts
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
