// Dónde está el backend. La decisión vive en direccion.ts (función pura, con pruebas); aquí solo se leen los datos de Expo.
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { resolverUrlApi, urlWebSocket } from './direccion';

/** Servidor de Expo que sirve la app ('192.168.1.20:8081'); en Expo Go es la PC del desarrollador. */
const hostEmpaquetador = Constants.expoConfig?.hostUri ?? null;

export const API_URL = resolverUrlApi({
  plataforma: Platform.OS,
  urlApi: process.env.EXPO_PUBLIC_API_URL,
  hostEmpaquetador,
});

export const WS_URL = process.env.EXPO_PUBLIC_WEBSOCKET_URL?.trim() || urlWebSocket(API_URL);
