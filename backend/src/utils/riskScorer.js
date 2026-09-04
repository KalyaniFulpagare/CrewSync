/**
 * Rule-based "is this event at risk" scorer.
 *
 * Combines three real signals that a human coordinator would actually look
 * at when checking if an event is on track:
 *   1. % of tasks overdue (past dueDate, not DONE)
 *   2. days since the last recorded activity on the event
 *   3. whether any CRITICAL-PATH task (slack === 0, from criticalPath.js)
 *      is not yet DONE — a stalled critical task delays the whole event
 *      even if most other tasks look fine
 *
 * Each signal contributes points; the total maps to a status label. This
 * is intentionally simple and explainable (not a black-box model) — every
 * point on the score traces back to a concrete, named reason, which is
 * shown alongside the label so a team head knows *why* an event was flagged.
 */
function scoreEventRisk({ tasks, criticalPathResult, lastActivityAt }) {
  const now = Date.now();
  const reasons = [];
  let points = 0;

  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter((t) => t.status !== 'DONE' && new Date(t.dueDate).getTime() < now);
  const overduePct = totalTasks ? overdueTasks.length / totalTasks : 0;

  if (overduePct >= 0.4) {
    points += 3;
    reasons.push(`${Math.round(overduePct * 100)}% of tasks are overdue`);
  } else if (overduePct >= 0.15) {
    points += 1;
    reasons.push(`${Math.round(overduePct * 100)}% of tasks are overdue`);
  }

  const daysSinceActivity = lastActivityAt ? (now - new Date(lastActivityAt).getTime()) / 86400000 : Infinity;
  if (daysSinceActivity >= 5) {
    points += 2;
    reasons.push(`No activity logged in ${Math.floor(daysSinceActivity)} days`);
  } else if (daysSinceActivity >= 2) {
    points += 1;
    reasons.push(`No activity logged in ${Math.floor(daysSinceActivity)} days`);
  }

  const stalledCritical = (criticalPathResult || []).filter((r) => r.isCritical).filter((r) => {
    const task = tasks.find((t) => String(t._id) === r.taskId);
    return task && task.status !== 'DONE';
  });
  if (stalledCritical.length > 0) {
    points += 3;
    reasons.push(`${stalledCritical.length} critical-path task(s) not yet done`);
  }

  let status = 'ON_TRACK';
  if (points >= 5) status = 'CRITICAL';
  else if (points >= 2) status = 'AT_RISK';

  return { status, points, reasons };
}

module.exports = { scoreEventRisk };
