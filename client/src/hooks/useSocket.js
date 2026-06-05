import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const serverUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || undefined;

export function useSocket(onEvent, { notify = false } = {}) {
  const { token } = useAuth();
  const { toast } = useToast();
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(serverUrl, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    const handler = (payload) => {
      if (notify) {
        const id = payload?.complaint?.complaintId || payload?.complaintId;
        if (id) toast(`Complaint ${id} updated`, 'info');
      }
      cbRef.current?.(payload);
    };

    socket.on('complaint:created', handler);
    socket.on('complaint:updated', handler);
    socket.on('complaint:deleted', handler);
    return () => {
      socket.off('complaint:created', handler);
      socket.off('complaint:updated', handler);
      socket.off('complaint:deleted', handler);
      socket.disconnect();
    };
  }, [token, notify, toast]);
}
