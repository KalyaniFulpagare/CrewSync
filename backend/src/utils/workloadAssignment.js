/**
 * Suggests who a new task should go to, instead of a plain dropdown pick.
 *
 * Each candidate member is scored by:
 *   - number of currently open (not DONE) tasks assigned to them
 *   - total remaining estimated hours across those open tasks
 *   - urgency pressure: open tasks due within the next 3 days count double,
 *     since a member buried in near-term deadlines shouldn't get more work
 *     even if their total open-task count looks average
 *
 * Lower score = more available. Returns candidates ranked ascending by
 * score, so the caller can suggest the top of the list or show the full
 * ranking.
 */
function scoreWorkload(member, openTasks) {
  const now = Date.now();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  let score = 0;
  let openCount = 0;

  for (const task of openTasks) {
    if (String(task.assignedTo) !== String(member.userId)) continue;
    openCount += 1;
    const dueInMs = new Date(task.dueDate).getTime() - now;
    const urgencyMultiplier = dueInMs <= THREE_DAYS_MS ? 2 : 1;
    score += task.estimatedHours * urgencyMultiplier;
  }

  return { userId: member.userId, name: member.name, openTaskCount: openCount, workloadScore: score };
}

function suggestAssignee(members, openTasks) {
  return members
    .map((member) => scoreWorkload(member, openTasks))
    .sort((a, b) => a.workloadScore - b.workloadScore);
}

module.exports = { suggestAssignee, scoreWorkload };
