import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    // Don't connect until we actually have a logged-in user - otherwise we'd
    // connect with a null/stale token and the server would reject it.
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // Sent as socket auth (not a header) - the server's io.use() middleware
    // verifies this token and rejects the connection outright if it's
    // missing or invalid, so an unauthenticated socket can never even reach
    // join_channel in the first place.
    // `auth` is a callback (not a plain object) so socket.io re-reads
    // localStorage on every (re)connect attempt, instead of freezing
    // whatever token happened to exist the moment this effect first ran.
    const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined;
    const socket = io(socketUrl, {
      path: '/socket.io',
      auth: (cb) => cb({ token: localStorage.getItem('crewsync_token') })
    });
    socketRef.current = socket;

    return () => socket.disconnect();
  }, [user]);

  return <SocketContext.Provider value={socketRef}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
