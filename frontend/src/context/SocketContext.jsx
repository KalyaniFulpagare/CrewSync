import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  useEffect(() => {
    const token = localStorage.getItem('crewsync_token');
    // Sent as socket auth (not a header) — the server's io.use() middleware
    // verifies this token and rejects the connection outright if it's
    // missing or invalid, so an unauthenticated socket can never even reach
    // join_channel in the first place.
    socketRef.current = io('/', { path: '/socket.io', auth: { token } });
    return () => socketRef.current?.disconnect();
  }, []);
  return <SocketContext.Provider value={socketRef}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
