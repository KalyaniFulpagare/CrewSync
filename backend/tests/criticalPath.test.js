const { computeCriticalPath } = require('../src/utils/criticalPath');

const t = (id, hours, deps = []) => ({ _id: id, estimatedHours: hours, dependsOn: deps });

describe('computeCriticalPath', () => {
  test('a linear chain is entirely critical, with earliest/latest matching', () => {
    // A(3h) -> B(5h) -> C(4h), each strictly depends on the previous.
    const A = t('A', 3);
    const B = t('B', 5, ['A']);
    const C = t('C', 4, ['B']);

    const result = computeCriticalPath([A, B, C]);
    const byId = Object.fromEntries(result.map((r) => [r.taskId, r]));

    expect(byId.A.earliestStart).toBe(0);
    expect(byId.A.earliestFinish).toBe(3);
    expect(byId.B.earliestStart).toBe(3);
    expect(byId.B.earliestFinish).toBe(8);
    expect(byId.C.earliestStart).toBe(8);
    expect(byId.C.earliestFinish).toBe(12);

    // Every task in a pure linear chain has zero slack.
    expect(byId.A.isCritical).toBe(true);
    expect(byId.B.isCritical).toBe(true);
    expect(byId.C.isCritical).toBe(true);
  });

  test('a task on a shorter parallel branch has positive slack and is not critical', () => {
    // A(5h) -> C(3h)   <- the long path, 8h total
    // B(1h) -> C(3h)   <- the short path, 4h total, B has slack
    const A = t('A', 5);
    const B = t('B', 1);
    const C = t('C', 3, ['A', 'B']);

    const result = computeCriticalPath([A, B, C]);
    const byId = Object.fromEntries(result.map((r) => [r.taskId, r]));

    expect(byId.A.isCritical).toBe(true);
    expect(byId.C.isCritical).toBe(true);
    expect(byId.B.isCritical).toBe(false);
    expect(byId.B.slack).toBeGreaterThan(0);
  });

  test('throws a CYCLE_DETECTED error when the dependency graph has a cycle', () => {
    const A = t('A', 2, ['B']);
    const B = t('B', 2, ['A']);

    expect(() => computeCriticalPath([A, B])).toThrow();
    try {
      computeCriticalPath([A, B]);
    } catch (err) {
      expect(err.code).toBe('CYCLE_DETECTED');
    }
  });

  test('tasks with no dependencies at all all start at time zero', () => {
    const A = t('A', 2);
    const B = t('B', 4);
    const result = computeCriticalPath([A, B]);
    expect(result.every((r) => r.earliestStart === 0)).toBe(true);
  });
});
