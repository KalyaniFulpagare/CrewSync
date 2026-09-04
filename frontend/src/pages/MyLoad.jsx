import React, { useEffect, useState } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import client from '../api/client';

const bandStyles = {
  LOW: 'bg-emerald-50 text-emerald-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-red-50 text-danger'
};

export default function MyLoad() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get('/clubs/my-load').then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="p-8 text-text-muted text-sm">Loadingâ€¦</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-1">My total load</h1>
      <p className="text-text-muted text-sm mb-6">Your workload summed across every club you're part of â€” not just one.</p>

      {data.hiddenOverload && (
        <div className="flex items-start gap-2 bg-red-50 text-danger rounded-xl p-4 mb-6">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">
            <span className="font-semibold">Hidden overload detected.</span> No single club's dashboard would catch
            this â€” you look fine on each one individually, but your combined load across all of them is high.
          </p>
        </div>
      )}

      <div className={`rounded-xl p-5 mb-6 ${bandStyles[data.totalBand]}`}>
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold text-lg">Combined load</span>
          <span className="text-sm font-medium">{data.totalBand}</span>
        </div>
        <p className="text-sm opacity-80 mt-1">{data.totalOpenTasks} open tasks Â· score {data.totalScore.toFixed(1)}</p>
      </div>

      <h2 className="font-display font-semibold text-text mb-3 flex items-center gap-1.5">
        <Sparkles size={16} className="text-accent" /> Breakdown by club
      </h2>
      {data.perClub.length === 0 ? (
        <p className="text-sm text-text-muted">No open tasks anywhere right now.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.perClub.map((c) => (
            <div key={c.clubId} className="bg-surface border border-black/5 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium">{c.clubName}</span>
              <span className="text-xs text-text-muted">{c.openTaskCount} open Â· score {c.workloadScore.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

