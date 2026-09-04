import React from 'react';
import { GitBranch } from 'lucide-react';

// Renders the CPM output as a simple horizontal timeline: each task's bar
// starts at its earliestStart and spans estimatedHours. Critical-path tasks
// (zero slack) are drawn in the accent color; everything else is muted,
// so the chain that actually controls the event's timeline is visually
// obvious at a glance.
export default function CriticalPathPanel({ criticalPath, tasks, cycleError }) {
  if (cycleError) {
    return (
      <div className="bg-red-50 text-danger text-sm rounded-lg px-3 py-2">
        Dependency cycle detected: {cycleError}
      </div>
    );
  }

  if (!criticalPath || criticalPath.length === 0) {
    return <p className="text-sm text-text-muted">No tasks yet to schedule.</p>;
  }

  const maxFinish = Math.max(...criticalPath.map((r) => r.earliestFinish), 1);
  const taskById = Object.fromEntries(tasks.map((t) => [String(t._id), t]));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-text">
        <GitBranch size={16} className="text-accent" /> Schedule (critical path in accent)
      </div>
      <div className="flex flex-col gap-2">
        {criticalPath.map((r) => {
          const task = taskById[r.taskId];
          const leftPct = (r.earliestStart / maxFinish) * 100;
          const widthPct = Math.max(((r.earliestFinish - r.earliestStart) / maxFinish) * 100, 3);
          return (
            <div key={r.taskId} className="flex items-center gap-3 text-xs">
              <span className="w-36 truncate text-text-muted">{task?.title || 'â€”'}</span>
              <div className="flex-1 h-5 bg-paper rounded-md relative overflow-hidden">
                <div
                  className={`h-full rounded-md ${r.isCritical ? 'bg-accent' : 'bg-gray-300'}`}
                  style={{ marginLeft: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`slack: ${r.slack}h`}
                />
              </div>
              <span className="w-16 text-right text-text-muted">{r.isCritical ? 'critical' : `+${r.slack}h`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

