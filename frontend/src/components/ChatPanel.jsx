import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import client from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// A single reusable chat panel for either a CLUB-wide channel or a TEAM
// channel. Joins the matching Socket.IO room, tracks who else is online in
// THIS channel via presence_update events, and appends new messages live.
export default function ChatPanel({ channelType, channelId, title }) {
  const socketRef = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [onlineIds, setOnlineIds] = useState(new Set());
  const scrollRef = useRef(null);

  useEffect(() => {
    client.get(`/messages/${channelType}/${channelId}`).then((res) => setMessages(res.data.messages));
  }, [channelType, channelId]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !user) return;

    socket.emit('join_channel', { channelType, channelId, userId: user.id });

    const onMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const onPresence = ({ userId, online }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId); else next.delete(userId);
        return next;
      });
    };
    const onPresenceSnapshot = ({ userIds }) => setOnlineIds(new Set(userIds));

    socket.on('hub_message', onMessage);
    socket.on('presence_update', onPresence);
    socket.on('presence_snapshot', onPresenceSnapshot);

    return () => {
      socket.emit('leave_channel', { channelType, channelId, userId: user.id });
      socket.off('hub_message', onMessage);
      socket.off('presence_update', onPresence);
      socket.off('presence_snapshot', onPresenceSnapshot);
    };
  }, [socketRef, channelType, channelId, user]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await client.post(`/messages/${channelType}/${channelId}`, { text });
    setText('');
  };

  return (
    <div className="bg-surface border border-black/5 rounded-xl p-5 flex flex-col h-96">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-sm">{title}</h3>
        <span className="text-[10px] text-text-muted">{onlineIds.size} online</span>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-3">
        {messages.map((m) => (
          <div key={m._id} className="text-sm bg-paper rounded-lg px-3 py-2">
            <span className="font-medium inline-flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${onlineIds.has(String(m.userId?._id)) ? 'bg-success' : 'bg-gray-300'}`} />
              {m.userId?.name}:
            </span>{' '}
            {m.text}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the teamâ€¦"
          className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
        <button className="bg-accent text-white px-3 rounded-lg"><Send size={16} /></button>
      </form>
    </div>
  );
}

