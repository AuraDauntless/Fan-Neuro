import { useState, useEffect, useRef, useCallback } from 'react';
import type { EEGDataPayload } from './useMockEEGData';

export type CognitiveState = {
  state: 'Active' | 'Dormant';
  confidence: number;
  timestamp: number;
};

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [cognitiveState, setCognitiveState] = useState<CognitiveState | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data: CognitiveState = JSON.parse(event.data);
        if (data.state) {
          setCognitiveState(data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendEEGData = useCallback((data: EEGDataPayload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, cognitiveState, sendEEGData };
}
