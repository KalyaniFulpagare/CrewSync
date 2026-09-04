const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'], default: 'TODO' },
  dueDate: { type: Date, required: true },
  // Effort estimate in hours — the unit the workload and conflict-detection
  // algorithms both use to compare tasks that otherwise look unrelated.
  estimatedHours: { type: Number, default: 2, min: 0.5 },
  // IDs of tasks that must be DONE before this one can start.
  // This is the edge list the critical-path calculation walks.
  dependsOn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

taskSchema.index({ eventId: 1 });
taskSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Task', taskSchema);
