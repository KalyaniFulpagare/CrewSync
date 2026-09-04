import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

const config = {
  ON_TRACK: { label: 'On track', icon: ShieldCheck, cls: 'bg-emerald-50 text-emerald-700' },
  AT_RISK: { label: 'At risk', icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700' },
  CRITICAL: { label: 'Critical', icon: ShieldAlert, cls: 'bg-red-50 text-danger' }
};

export default function RiskBadge({ status, reasons = [] }) {
  const c = config[status] || config.ON_TRACK;
  const Icon = c.icon;
  return (
    <div className={`rounded-lg px-3 py-2 ${c.cls}`}>
      <div className="flex items-center gap-2 font-semibold text-sm mb-1">
        <Icon size={16} /> {c.label}
      </div>
      {reasons.length > 0 && (
        <ul className="text-xs opacity-80 space-y-0.5 list-disc list-inside">
          {reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      )}
    </div>
  );
}
