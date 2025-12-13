import { useCallback, useEffect, useState } from 'react';

export const useLiveKitAgent = ({
  agentId,
  userId,
  roomName = `room-${Date.now()}`,
  onConnectionStateChange,
  onError,
}) => {
  const [token, setToken] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const fetchToken = useCallback(async () => {
    try {
      setIsConnecting(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/voice/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: roomName,
          identity: userId,
          name: `User ${userId}`,
          duration_minutes: 60,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      setToken(data.token);
      setIsConnected(true);
      onConnectionStateChange?.('connected');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      onConnectionStateChange?.('error');
    } finally {
      setIsConnecting(false);
    }
  }, [roomName, userId, onConnectionStateChange, onError]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return {
    token,
    roomName,
    isConnecting,
    isConnected,
    refetchToken: fetchToken,
  };
};
