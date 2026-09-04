import React from 'react';
import TaskRow from './TaskRow';

const columns = [
  { status: 'TODO', label: 'To do', dot: 'bg-slate-400' },
  { status: 'IN_PROGRESS', label: 'In progress', dot: 'bg-accent' },
  { status: 'BLOCKED', label: 'Blocked', dot: 'bg-danger' },
  { status: 'DONE', label: 'Done', dot: 'bg-success' }
];

export default function TaskBoard({ tasks, onStatusChange, isCritical, ...taskProps }) {
  const handleDrop = (event, status) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    const task = tasks.find((item) => String(item._id) === taskId);
    if (task && task.status !== status) onStatusChange(task._id, status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3">
      {columns.map((column) => {
        const groupedTasks = tasks.filter((task) => task.status === column.status);
        return (
          <section key={column.status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, column.status)} className="rounded-xl bg-paper/80 border border-black/[0.04] p-3 min-h-44">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="flex items-center gap-2 text-xs font-semibold text-text"><span className={`w-2 h-2 rounded-full ${column.dot}`} />{column.label}</span>
              <span className="text-[11px] text-text-muted">{groupedTasks.length}</span>
            </div>
            <div className="space-y-2">
              {groupedTasks.map((task) => (
                <div key={task._id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', String(task._id))} className="bg-surface rounded-lg px-3 shadow-sm border border-black/[0.04] cursor-grab active:cursor-grabbing">
                  <TaskRow task={task} onStatusChange={onStatusChange} isCritical={typeof isCritical === 'function' ? isCritical(task._id) : isCritical} {...taskProps} />
                </div>
              ))}
              {groupedTasks.length === 0 && <p className="p-3 text-center text-xs text-text-muted border border-dashed border-black/10 rounded-lg">Drop tasks here</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
