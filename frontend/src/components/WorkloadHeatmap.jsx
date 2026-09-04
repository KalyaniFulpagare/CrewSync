import React from 'react';

const bandStyles = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-100',
  HIGH: 'bg-red-50 text-danger border-red-100'
};

// Club-wide workload heatmap: every member's load, summed across every
// event in the club — not just one event, which is what makes this
// different (and more useful) than the per-event workload suggestion.
export default function WorkloadHeatmap({ heatmap }) {
  if (!heatmap || heatmap.length === 0) return <p className="text-sm text-text-muted">No team members yet.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {heatmap.map((m) => (
        <div key={m.userId} className={`border rounded-lg px-3 py-2 flex items-center justify-between ${bandStyles[m.band]}`}>
          <span className="text-sm font-medium">{m.name}</span>
          <span className="text-xs opacity-80">{m.openTaskCount} open · {m.band.toLowerCase()}</span>
        </div>
      ))}
    </div>
  );
}
