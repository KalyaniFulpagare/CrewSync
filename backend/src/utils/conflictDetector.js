/**
 * Deadline conflict detection: load-leveling across a member's tasks.
 *
 * A member with 3 unrelated tasks all due the same day isn't visible as a
 * problem if you only look at each task individually — every single task
 * has a "reasonable" deadline. The conflict only shows up when you look at
 * the member's total daily workload.
 *
 * This buckets a member's open tasks by due date, sums estimatedHours per
 * day, and flags any day where the total exceeds a realistic daily-effort
 * threshold (default 6 hours, since a club member isn't a full-time
 * employee) — a simple interval/load-leveling technique.
 */
const DEFAULT_DAILY_CAPACITY_HOURS = 6;

// Buckets by LOCAL calendar day, not UTC. Using toISOString().slice(0, 10)
// would bucket by UTC day instead — for a task due at 3 AM IST (UTC+5:30),
// that's still the previous UTC day, silently shifting it into the wrong
// bucket and hiding (or inventing) a conflict. getFullYear/getMonth/getDate
// read the server's local time zone, which is what we want here.
function toLocalDayKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function detectConflicts(memberTasks, dailyCapacity = DEFAULT_DAILY_CAPACITY_HOURS) {
  const byDay = new Map();

  for (const task of memberTasks) {
    if (task.status === 'DONE') continue;
    const dayKey = toLocalDayKey(task.dueDate);
    if (!byDay.has(dayKey)) byDay.set(dayKey, { totalHours: 0, tasks: [] });
    const bucket = byDay.get(dayKey);
    bucket.totalHours += task.estimatedHours;
    bucket.tasks.push({ id: task._id, title: task.title, estimatedHours: task.estimatedHours });
  }

  const conflicts = [];
  for (const [day, bucket] of byDay.entries()) {
    if (bucket.totalHours > dailyCapacity) {
      conflicts.push({
        date: day,
        totalHours: bucket.totalHours,
        capacity: dailyCapacity,
        overBy: +(bucket.totalHours - dailyCapacity).toFixed(1),
        tasks: bucket.tasks
      });
    }
  }

  return conflicts.sort((a, b) => a.date.localeCompare(b.date));
}

module.exports = { detectConflicts, DEFAULT_DAILY_CAPACITY_HOURS, toLocalDayKey };
