/**
 * "My Total Load" — personal cross-club workload aggregation.
 *
 * The per-event and per-club algorithms are both scoped to one club at a
 * time, so neither can see the real problem a real student actually has:
 * being on Mozilla's Design Team, Aasamant's Outreach Team, and TEDx's
 * Event Management Team simultaneously, each of which independently thinks
 * "this person looks fine" while the person is actually stretched across
 * all three at once.
 *
 * Groups a single user's open tasks by which CLUB the task's event belongs
 * to, scores each club with the same urgency-weighted formula as
 * workloadAssignment.js, and also returns a combined total — the number no
 * single club's view could ever produce on its own.
 */
const { scoreWorkload } = require('./workloadAssignment');

function bandFor(score, maxReference) {
  if (maxReference <= 0) return 'LOW';
  const ratio = score / maxReference;
  if (ratio >= 0.66) return 'HIGH';
  if (ratio >= 0.33) return 'MEDIUM';
  return 'LOW';
}

/**
 * @param {Object} member - { userId, name }
 * @param {Array} tasksWithClub - open tasks, each annotated with a `clubId`
 *   and `clubName` (resolved from task.eventId.clubId before calling this).
 */
function buildPersonalLoad(member, tasksWithClub) {
  const byClub = new Map();

  for (const task of tasksWithClub) {
    if (String(task.assignedTo) !== String(member.userId)) continue;
    const key = String(task.clubId);
    if (!byClub.has(key)) byClub.set(key, { clubId: task.clubId, clubName: task.clubName, tasks: [] });
    byClub.get(key).tasks.push(task);
  }

  const perClub = [...byClub.values()].map(({ clubId, clubName, tasks }) => {
    const { workloadScore, openTaskCount } = scoreWorkload(member, tasks);
    return { clubId, clubName, workloadScore, openTaskCount };
  });

  const totalScore = perClub.reduce((sum, c) => sum + c.workloadScore, 0);
  const totalOpenTasks = perClub.reduce((sum, c) => sum + c.openTaskCount, 0);

  // Band the total against 6 "hours" as a rough single-day-capacity
  // reference point, same intuition as the daily-conflict detector,
  // scaled up since this is a standing cross-club total, not one day.
  const REFERENCE = 12;
  const totalBand = bandFor(totalScore, REFERENCE);

  return {
    totalScore,
    totalOpenTasks,
    totalBand,
    perClub: perClub.sort((a, b) => b.workloadScore - a.workloadScore),
    // The actual "wow" moment: true only when the combined total crosses
    // into HIGH while every individual club-level score would look calmer
    // (MEDIUM or below) — i.e. no single club's dashboard would have caught this.
    hiddenOverload: totalBand === 'HIGH' && perClub.every((c) => bandFor(c.workloadScore, REFERENCE) !== 'HIGH')
  };
}

module.exports = { buildPersonalLoad, bandFor };
