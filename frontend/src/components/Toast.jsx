import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message: e.detail }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    };
    window.addEventListener('api-error', handler);
    return () => window.removeEventListener('api-error', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-start gap-2 bg-white border border-red-200 shadow-lg rounded-lg px-4 py-3 max-w-sm text-sm text-text">
          <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
          <span className="flex-1">{t.message}</span>
          <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} className="text-text-muted hover:text-text">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
