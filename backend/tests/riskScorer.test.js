const { scoreEventRisk } = require('../src/utils/riskScorer');

const task = (id, status, dueOffsetDays) => ({
  _id: id, status,
  dueDate: new Date(Date.now() + dueOffsetDays * 86400000)
});

describe('scoreEventRisk', () => {
  test('an event with no overdue tasks and recent activity is ON_TRACK', () => {
    const tasks = [task('a', 'DONE', 2), task('b', 'TODO', 5)];
    const result = scoreEventRisk({ tasks, criticalPathResult: [], lastActivityAt: new Date() });
    expect(result.status).toBe('ON_TRACK');
    expect(result.reasons).toHaveLength(0);
  });

  test('heavily overdue tasks alone push status to AT_RISK (single signal, capped below CRITICAL)', () => {
    const tasks = [
      task('a', 'TODO', -3), task('b', 'TODO', -1), task('c', 'TODO', -2), task('d', 'DONE', 1)
    ]; // 3/4 = 75% overdue -> 3 points, below the 5-point CRITICAL threshold on its own
    const result = scoreEventRisk({ tasks, criticalPathResult: [], lastActivityAt: new Date() });
    expect(result.status).toBe('AT_RISK');
    expect(result.reasons.some((r) => r.includes('overdue'))).toBe(true);
  });

  test('overdue tasks combined with a stalled critical-path task escalate to CRITICAL', () => {
    const tasks = [
      task('a', 'TODO', -3), task('b', 'TODO', -1), task('c', 'TODO', -2), task('critTask', 'TODO', 5)
    ]; // overdue (3 pts) + stalled critical task (3 pts) = 6 pts, crosses the CRITICAL threshold
    const criticalPathResult = [{ taskId: 'critTask', isCritical: true }];
    const result = scoreEventRisk({ tasks, criticalPathResult, lastActivityAt: new Date() });
    expect(result.status).toBe('CRITICAL');
  });

  test('a stalled critical-path task alone is enough to flag AT_RISK or worse', () => {
    const tasks = [task('critTask', 'TODO', 5)];
    const criticalPathResult = [{ taskId: 'critTask', isCritical: true }];
    const result = scoreEventRisk({ tasks, criticalPathResult, lastActivityAt: new Date() });
    expect(result.status).not.toBe('ON_TRACK');
    expect(result.reasons.some((r) => r.includes('critical-path'))).toBe(true);
  });

  test('long silence since last activity contributes to risk even with healthy tasks', () => {
    const tasks = [task('a', 'TODO', 10)];
    const sixDaysAgo = new Date(Date.now() - 6 * 86400000);
    const result = scoreEventRisk({ tasks, criticalPathResult: [], lastActivityAt: sixDaysAgo });
    expect(result.reasons.some((r) => r.includes('No activity'))).toBe(true);
  });
});
