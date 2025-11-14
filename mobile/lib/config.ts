// Runtime configuration for API endpoints
// This file is loaded at runtime, allowing environment variables to be used dynamically

export const getApiConfig = () => {
  // IMPORTANT: When running on Expo Go (phone), use your PC's IP address, NOT Docker service names
  // Docker service name "backend" only works inside Docker network
  // Your phone needs to access via your PC's actual IP: 192.168.1.126
  const defaultApiUrl = 'http://192.168.1.126:8000/api';
  const defaultWsUrl = 'ws://192.168.1.126:8000/api/ws';

  const apiUrl = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl;
  const wsUrl = process.env.EXPO_PUBLIC_WEBSOCKET_URL || defaultWsUrl;

  console.log('🌐 API Config Loaded:', {
    apiUrl,
    wsUrl,
    note: 'Using PC IP (192.168.1.126) for Expo Go on phone',
    env: {
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_WEBSOCKET_URL: process.env.EXPO_PUBLIC_WEBSOCKET_URL,
    },
  });

  return {
    apiUrl,
    wsUrl,
  };
};

export const apiConfig = getApiConfig();
