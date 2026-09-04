import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, Sparkles, Send, Pencil, Trash2, X, LogOut, UserX, LayoutGrid } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import RiskBadge from '../components/RiskBadge';
import CriticalPathPanel from '../components/CriticalPathPanel';
import TaskBoard from '../components/TaskBoard';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketRef = useSocket();

  const [event, setEvent] = useState(null);
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [insights, setInsights] = useState(null);
  const [activity, setActivity] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const [taskForm, setTaskForm] = useState({ title: '', description: '', teamId: '', dueDate: '', estimatedHours: 2, dependsOn: [] });
  const [suggestion, setSuggestion] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editingEvent, setEditingEvent] = useState(false);
  const [eventEditForm, setEventEditForm] = useState(null);

  const loadAll = useCallback(async () => {
    const [eventRes, taskRes, insightRes, activityRes, commentRes] = await Promise.all([
      client.get(`/events/${id}`),
      client.get(`/tasks/${id}`),
      client.get(`/events/${id}/insights`),
      client.get(`/activity/${id}`),
      client.get(`/comments/${id}`)
    ]);
    setEvent(eventRes.data.event);
    setMembers(eventRes.data.members);
    setTeams(eventRes.data.teams || []);
    setTasks(taskRes.data.tasks);
    setInsights(insightRes.data);
    setActivity(activityRes.data.logs);
    setComments(commentRes.data.comments);
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    socket.emit('join_event', id);
    const onActivity = (entry) => setActivity((prev) => [entry, ...prev]);
    const onComment = (c) => setComments((prev) => [...prev, c]);
    socket.on('activity_logged', onActivity);
    socket.on('comment_added', onComment);
    return () => { socket.off('activity_logged', onActivity); socket.off('comment_added', onComment); };
  }, [socketRef, id]);

  const handleStatusChange = async (taskId, status) => {
    const currentTask = tasks.find((t) => String(t._id) === String(taskId));
    try {
      await client.patch(`/tasks/item/${taskId}/status`, { status, expectedVersion: currentTask?.__v });
    } catch (err) {
      if (err.response?.status === 409) {
        alert('This task was just updated by someone else - refreshing to show the latest version.');
      } else {
        throw err;
      }
    }
    const [taskRes, insightRes] = await Promise.all([client.get(`/tasks/${id}`), client.get(`/events/${id}/insights`)]);
    setTasks(taskRes.data.tasks);
    setInsights(insightRes.data);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    await client.post(`/tasks/${id}`, taskForm);
    setTaskForm({ title: '', description: '', teamId: '', dueDate: '', estimatedHours: 2, dependsOn: [] });
    setSuggestion(null);
    const [taskRes, insightRes] = await Promise.all([client.get(`/tasks/${id}`), client.get(`/events/${id}/insights`)]);
    setTasks(taskRes.data.tasks);
    setInsights(insightRes.data);
  };

  const handleSaveTaskEdit = async (e) => {
    e.preventDefault();
    await client.patch(`/tasks/item/${editingTask._id}`, {
      title: editingTask.title, description: editingTask.description, teamId: editingTask.teamId?._id || editingTask.teamId || null,
      dueDate: editingTask.dueDate, estimatedHours: editingTask.estimatedHours
    });
    setEditingTask(null);
    const [taskRes, insightRes] = await Promise.all([client.get(`/tasks/${id}`), client.get(`/events/${id}/insights`)]);
    setTasks(taskRes.data.tasks);
    setInsights(insightRes.data);
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await client.delete(`/tasks/item/${taskId}`);
      const [taskRes, insightRes] = await Promise.all([client.get(`/tasks/${id}`), client.get(`/events/${id}/insights`)]);
      setTasks(taskRes.data.tasks);
      setInsights(insightRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete this task.');
    }
  };

  const openEventEdit = () => {
    setEventEditForm({
      title: event.title, description: event.description,
      eventDate: new Date(event.eventDate).toISOString().slice(0, 10),
      venue: event.venue, budget: event.budget, status: event.status
    });
    setEditingEvent(true);
  };

  const handleSaveEventEdit = async (e) => {
    e.preventDefault();
    const res = await client.patch(`/events/${id}`, eventEditForm);
    setEvent((prev) => ({ ...prev, ...res.data.event }));
    setEditingEvent(false);
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Delete this entire event, including all its tasks? This cannot be undone.')) return;
    try {
      await client.delete(`/events/${id}`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete this event.');
    }
  };

  const handleSuggest = async () => {
    const res = await client.get(`/tasks/${id}/suggest-assignee`);
    setSuggestion(res.data.ranking);
  };

  const handleAssign = async (taskId, userId) => {
    await client.patch(`/tasks/item/${taskId}/assign`, { userId });
    const taskRes = await client.get(`/tasks/${id}`);
    setTasks(taskRes.data.tasks);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    await client.post(`/events/${id}/invite`, { email: inviteEmail });
    setInviteEmail('');
    const eventRes = await client.get(`/events/${id}`);
    setMembers(eventRes.data.members);
  };

  const handleLeaveEvent = async () => {
    if (!confirm('Leave this event?')) return;
    try {
      await client.post(`/events/${id}/leave`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not leave this event.');
    }
  };

  const handleRemoveEventMember = async (membershipId) => {
    if (!confirm('Remove this member from the event?')) return;
    try {
      await client.delete(`/events/${id}/members/${membershipId}`);
      const eventRes = await client.get(`/events/${id}`);
      setMembers(eventRes.data.members);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not remove this member.');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await client.post(`/comments/${id}`, { text: newComment });
    setNewComment('');
  };

  if (!event || !insights) {
    return <div className="p-8 text-sm text-text-muted">Loading event...</div>;
  }

  const isHost = String(event.host?._id || event.host) === String(user?.id);
  const acceptedMembers = members.filter((member) => member.status === 'ACCEPTED');
  const criticalTaskIds = new Set((insights.criticalPath || []).filter((item) => item.isCritical).map((item) => String(item.taskId)));
  const formatDate = (date) => new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-xs text-text-muted hover:text-text mb-4">Back to events</button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="font-display text-2xl font-bold text-text">{event.title}</h1>
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-paper text-text-muted">{event.status.toLowerCase()}</span>
          </div>
          {event.description && <p className="max-w-2xl text-sm text-text-muted">{event.description}</p>}
          <p className="mt-2 text-xs text-text-muted">{formatDate(event.eventDate)}{event.venue ? ` · ${event.venue}` : ''}{event.budget ? ` · Rs. ${event.budget}` : ''}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isHost && <button onClick={openEventEdit} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/10 text-xs font-medium hover:border-accent"><Pencil size={14} /> Edit event</button>}
          {isHost ? (
            <button onClick={handleDeleteEvent} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-danger hover:bg-red-50"><Trash2 size={14} /> Delete</button>
          ) : (
            <button onClick={handleLeaveEvent} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-danger hover:bg-red-50"><LogOut size={14} /> Leave</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <main className="xl:col-span-2 flex flex-col gap-6">
          <section className="bg-surface border border-black/5 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display font-semibold text-text flex items-center gap-2"><LayoutGrid size={17} className="text-accent" /> Task board</h2>
              <button onClick={handleSuggest} className="inline-flex items-center gap-1.5 text-xs font-medium text-accent"><Sparkles size={14} /> Suggest assignee</button>
            </div>

            <form onSubmit={handleCreateTask} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5 rounded-xl bg-paper/70 p-3">
              <input required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Add a task" className="min-w-0 px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <select value={taskForm.teamId} onChange={(e) => setTaskForm({ ...taskForm, teamId: e.target.value })} className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent bg-white"><option value="">No team owner</option>{teams.map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}</select>
              <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} rows={2} placeholder="What needs to be done? (optional)" className="sm:col-span-2 px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent resize-none" />
              <input required type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <div className="flex gap-2"><input required min="0.5" step="0.5" type="number" value={taskForm.estimatedHours} onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: Number(e.target.value) })} className="w-24 px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" title="Estimated hours" /><button className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/90">Add task</button></div>
              {tasks.length > 0 && <label className="sm:col-span-2 text-xs text-text-muted">
                Depends on
                <select multiple value={taskForm.dependsOn} onChange={(e) => setTaskForm({ ...taskForm, dependsOn: Array.from(e.target.selectedOptions, (option) => option.value) })} className="mt-1 block w-full px-3 py-2 rounded-lg border border-black/10 text-sm text-text bg-white outline-none focus:border-accent">
                  {tasks.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
                </select>
                <span className="block mt-1">Optional: hold Ctrl/Cmd to select multiple prerequisite tasks.</span>
              </label>}
            </form>

            {tasks.length === 0 ? <p className="text-sm text-text-muted py-3">No tasks yet. Add the first one above.</p> : <TaskBoard tasks={tasks} onStatusChange={handleStatusChange} onAssign={handleAssign} members={acceptedMembers.map((member) => member.userId).filter(Boolean)} onEdit={setEditingTask} onDelete={handleDeleteTask} isCritical={(taskId) => criticalTaskIds.has(String(taskId))} hasConflict={false} />}

            {suggestion && (
              <div className="mt-4 rounded-lg bg-accent-soft p-3">
                <p className="text-xs font-semibold text-accent mb-2">Workload-aware assignment ranking</p>
                <div className="flex flex-wrap gap-2">
                  {suggestion.map((person) => <span key={person.userId} className="text-xs text-text">{person.name} <span className="text-text-muted">({person.workloadScore}h load)</span></span>)}
                </div>
              </div>
            )}
          </section>

          <section className="bg-surface border border-black/5 rounded-xl p-5">
            <CriticalPathPanel criticalPath={insights.criticalPath} tasks={tasks} cycleError={insights.cycleError} />
          </section>

          <section className="bg-surface border border-black/5 rounded-xl p-5">
            <h2 className="font-display font-semibold text-text mb-4">Discussion</h2>
            <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
              {comments.length === 0 ? <p className="text-sm text-text-muted">No comments yet.</p> : comments.map((comment) => (
                <div key={comment._id} className="text-sm">
                  <span className="font-medium text-text">{comment.userId?.name || 'Member'}</span>
                  <span className="text-text-muted"> · {new Date(comment.createdAt).toLocaleString()}</span>
                  <p className="text-text mt-0.5">{comment.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} className="flex gap-2">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <button aria-label="Send comment" className="bg-accent text-white p-2 rounded-lg hover:bg-accent/90"><Send size={16} /></button>
            </form>
          </section>
        </main>

        <aside className="flex flex-col gap-6">
          <RiskBadge status={insights.risk?.status} reasons={insights.risk?.reasons} />

          <section className="bg-surface border border-black/5 rounded-xl p-5">
            <h2 className="font-display font-semibold text-text mb-3">Event members</h2>
            <div className="space-y-2 mb-4">
              {acceptedMembers.map((member) => (
                <div key={member._id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-text truncate">{member.userId?.name} {member.role === 'HEAD' && <span className="text-xs text-text-muted">(host)</span>}</span>
                  {isHost && String(member.userId?._id) !== String(user?.id) && <button onClick={() => handleRemoveEventMember(member._id)} title="Remove member" className="text-text-muted hover:text-danger"><UserX size={14} /></button>}
                </div>
              ))}
            </div>
            {isHost && <form onSubmit={handleInvite} className="flex gap-2">
              <input required type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="member@email.com" className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-black/10 text-xs outline-none focus:border-accent" />
              <button title="Invite member" className="p-2 text-accent border border-black/10 rounded-lg hover:border-accent"><UserPlus size={15} /></button>
            </form>}
          </section>

          <section className="bg-surface border border-black/5 rounded-xl p-5">
            <h2 className="font-display font-semibold text-text mb-3">Activity</h2>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {activity.length === 0 ? <p className="text-sm text-text-muted">No activity yet.</p> : activity.map((entry) => (
                <div key={entry._id} className="text-xs">
                  <p className="text-text"><span className="font-medium">{entry.userId?.name || 'Someone'}</span> {entry.action.replaceAll('_', ' ').toLowerCase()}</p>
                  <p className="text-text-muted mt-0.5">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4"><h2 className="font-display font-semibold">Edit task</h2><button onClick={() => setEditingTask(null)}><X size={18} /></button></div>
            <form onSubmit={handleSaveTaskEdit} className="flex flex-col gap-3">
              <input required value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} className="px-3 py-2 rounded-lg border border-black/10 text-sm" />
              <textarea value={editingTask.description || ''} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} rows={3} placeholder="Task description" className="px-3 py-2 rounded-lg border border-black/10 text-sm resize-none" />
              <select value={editingTask.teamId?._id || editingTask.teamId || ''} onChange={(e) => setEditingTask({ ...editingTask, teamId: e.target.value })} className="px-3 py-2 rounded-lg border border-black/10 text-sm bg-white"><option value="">No team owner</option>{teams.map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}</select>
              <input required type="date" value={new Date(editingTask.dueDate).toISOString().slice(0, 10)} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} className="px-3 py-2 rounded-lg border border-black/10 text-sm" />
              <input required min="1" type="number" value={editingTask.estimatedHours} onChange={(e) => setEditingTask({ ...editingTask, estimatedHours: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-black/10 text-sm" />
              <button className="bg-accent text-white text-sm font-medium py-2.5 rounded-lg">Save changes</button>
            </form>
          </div>
        </div>
      )}

      {editingEvent && eventEditForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h2 className="font-display font-semibold">Edit event</h2><button onClick={() => setEditingEvent(false)}><X size={18} /></button></div>
            <form onSubmit={handleSaveEventEdit} className="flex flex-col gap-3">
              <input required value={eventEditForm.title} onChange={(e) => setEventEditForm({ ...eventEditForm, title: e.target.value })} className="px-3 py-2 rounded-lg border border-black/10 text-sm" />
              <textarea value={eventEditForm.description || ''} onChange={(e) => setEventEditForm({ ...eventEditForm, description: e.target.value })} rows={3} className="px-3 py-2 rounded-lg border border-black/10 text-sm resize-none" />
              <input required type="date" value={eventEditForm.eventDate} onChange={(e) => setEventEditForm({ ...eventEditForm, eventDate: e.target.value })} className="px-3 py-2 rounded-lg border border-black/10 text-sm" />
              <input value={eventEditForm.venue || ''} onChange={(e) => setEventEditForm({ ...eventEditForm, venue: e.target.value })} placeholder="Venue" className="px-3 py-2 rounded-lg border border-black/10 text-sm" />
              <input min="0" type="number" value={eventEditForm.budget || 0} onChange={(e) => setEventEditForm({ ...eventEditForm, budget: Number(e.target.value) })} placeholder="Budget" className="px-3 py-2 rounded-lg border border-black/10 text-sm" />
              <select value={eventEditForm.status} onChange={(e) => setEventEditForm({ ...eventEditForm, status: e.target.value })} className="px-3 py-2 rounded-lg border border-black/10 text-sm bg-white"><option value="PLANNED">Planned</option><option value="ONGOING">Ongoing</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select>
              <button className="bg-accent text-white text-sm font-medium py-2.5 rounded-lg">Save changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

