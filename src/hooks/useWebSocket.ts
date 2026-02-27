/**
 * useWebSocket — React hook for connecting to FastAPI WebSocket channels.
 * Automatically reconnects with exponential backoff.
 * Feeds data into Zustand store via updateFromServer.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_BASE } from '@/lib/fastapi';

interface UseWebSocketOptions {
  /** WebSocket channel path, e.g. "grid", "frequency", "solar", "coherence" */
  channel: string;
  /** Callback when a message is received */
  onMessage?: (data: any) => void;
  /** Auto-connect on mount (default true) */
  autoConnect?: boolean;
  /** Max reconnect attempts (default 20) */
  maxRetries?: number;
}

interface UseWebSocketReturn {
  /** Latest parsed message data */
  data: any;
  /** Whether WebSocket is connected */
  connected: boolean;
  /** Manually send a message */
  send: (msg: string) => void;
  /** Manually reconnect */
  reconnect: () => void;
}

export function useWebSocket({
  channel,
  onMessage,
  autoConnect = true,
  maxRetries = 20,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    // Don't connect if already connected or server-side
    if (typeof window === 'undefined') return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = `${WS_BASE}/ws/${channel}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setData(parsed);
        onMessageRef.current?.(parsed);
      } catch {
        setData(event.data);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      // Exponential backoff reconnect
      if (retriesRef.current < maxRetries) {
        const delay = Math.min(1000 * 2 ** retriesRef.current, 30000);
        retriesRef.current += 1;
        timerRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [channel, maxRetries]);

  const send = useCallback((msg: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(msg);
    }
  }, []);

  const reconnect = useCallback(() => {
    wsRef.current?.close();
    retriesRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  return { data, connected, send, reconnect };
}
