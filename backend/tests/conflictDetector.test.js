const { detectConflicts } = require('../src/utils/conflictDetector');

const task = (title, hours, dueDate, status = 'TODO') => ({ _id: title, title, estimatedHours: hours, dueDate, status });

describe('detectConflicts (deadline load-leveling)', () => {
  test('flags a day where combined task effort exceeds daily capacity', () => {
    const day = new Date('2026-09-10T10:00:00Z');
    const tasks = [
      task('Poster design', 4, day),
      task('Venue confirmation', 4, day) // 8h total > 6h default capacity
    ];
    const conflicts = detectConflicts(tasks);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].totalHours).toBe(8);
    expect(conflicts[0].overBy).toBe(2);
  });

  test('does not flag a day at or under capacity', () => {
    const day = new Date('2026-09-11T10:00:00Z');
    const tasks = [task('Light task', 3, day), task('Another light task', 3, day)]; // exactly 6h
    expect(detectConflicts(tasks)).toHaveLength(0);
  });

  test('ignores DONE tasks when computing daily load', () => {
    const day = new Date('2026-09-12T10:00:00Z');
    const tasks = [
      task('Finished already', 5, day, 'DONE'),
      task('Still pending', 5, day)
    ];
    // Only the pending 5h counts, well under the 6h default.
    expect(detectConflicts(tasks)).toHaveLength(0);
  });

  test('tasks on different days do not compound into a false conflict', () => {
    const dayOne = new Date('2026-09-13T10:00:00Z');
    const dayTwo = new Date('2026-09-14T10:00:00Z');
    const tasks = [task('Task A', 5, dayOne), task('Task B', 5, dayTwo)];
    expect(detectConflicts(tasks)).toHaveLength(0);
  });
});
