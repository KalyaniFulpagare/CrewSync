import React from 'react';
import { AlertCircle, Pencil, Trash2 } from 'lucide-react';

const statusColors = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-accent-soft text-accent',
  DONE: 'bg-emerald-50 text-emerald-700',
  BLOCKED: 'bg-red-50 text-danger'
};

export default function TaskRow({ task, onStatusChange, onAssign, members = [], onEdit, onDelete, isCritical, hasConflict }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-black/5 last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text truncate">{task.title}</p>
          {isCritical && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent-soft text-accent shrink-0">critical path</span>}
          {hasConflict && <AlertCircle size={14} className="text-warning shrink-0" />}
        </div>
        <p className="text-xs text-text-muted">
          {task.teamId?.name && `${task.teamId.name} · `}{task.assignedTo?.name || 'Unassigned'} · due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {task.estimatedHours}h
        </p>
        {task.description && <p className="text-xs text-text-muted mt-1 line-clamp-2">{task.description}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <select
          value={task.assignedTo?._id || ''}
          onChange={(e) => onAssign(task._id, e.target.value || null)}
          aria-label={`Assign ${task.title}`}
          className="max-w-28 text-xs px-2 py-1 rounded-md border border-black/10 bg-white text-text-muted outline-none"
        >
          <option value="">Unassigned</option>
          {members.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}
        </select>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          className={`text-xs font-medium px-2 py-1 rounded-md border-0 outline-none ${statusColors[task.status]}`}
        >
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        <button onClick={() => onEdit(task)} className="text-text-muted hover:text-accent p-1"><Pencil size={14} /></button>
        <button onClick={() => onDelete(task._id)} className="text-text-muted hover:text-danger p-1"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

