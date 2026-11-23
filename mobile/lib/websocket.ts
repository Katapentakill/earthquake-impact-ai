// Copia de frontend/src/lib/websocket.ts (misma lógica; solo cambia el tipo del aviso). Reconecta solo cada 5 s y avisa del estado de la conexión.
import type { SeismicEvent } from './types';

export type WebSocketMessage = {
  type: 'connection' | 'new_earthquake' | 'pong' | 'echo';
  message?: string;
  // El backend manda el evento como diccionario plano (event_id, magnitud, lugar…); se acepta también {event, impacts}.
  data?: Partial<SeismicEvent> & { event?: SeismicEvent };
  timestamp?: number;
};

type MessageHandler = (message: WebSocketMessage) => void;
type StatusHandler = (conectado: boolean) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: MessageHandler[] = [];
  private statusHandlers: StatusHandler[] = [];
  private reconnectInterval: number = 5000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private cerrado = false;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.cerrado = false;
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      ws.onopen = () => {
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.statusHandlers.forEach((h) => h(true));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handlers.forEach((handler) => handler(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        this.statusHandlers.forEach((h) => h(false));
        if (!this.cerrado) this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
  }

  disconnect() {
    this.cerrado = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      // Sin ruido en la consola si se cierra antes de terminar de conectar (por ejemplo, en modo estricto de React).
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler);
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.push(handler);
  }

  removeHandler(handler: MessageHandler) {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

export default WebSocketClient;
