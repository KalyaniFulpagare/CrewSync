const { suggestAssignee } = require('../src/utils/workloadAssignment');

describe('suggestAssignee (workload-balanced assignment)', () => {
  test('ranks a member with fewer/lighter open tasks above a heavily-loaded one', () => {
    const members = [
      { userId: 'alice', name: 'Alice' },
      { userId: 'bob', name: 'Bob' }
    ];
    const farFuture = new Date(Date.now() + 20 * 86400000);
    const openTasks = [
      { assignedTo: 'alice', estimatedHours: 5, dueDate: farFuture },
      { assignedTo: 'alice', estimatedHours: 5, dueDate: farFuture },
      { assignedTo: 'bob', estimatedHours: 2, dueDate: farFuture }
    ];

    const ranking = suggestAssignee(members, openTasks);
    expect(ranking[0].userId).toBe('bob');
    expect(ranking[0].workloadScore).toBeLessThan(ranking[1].workloadScore);
  });

  test('a task due within 3 days counts double, so near-term pressure outweighs raw hour totals', () => {
    const members = [{ userId: 'alice', name: 'Alice' }, { userId: 'bob', name: 'Bob' }];
    const soon = new Date(Date.now() + 1 * 86400000);
    const later = new Date(Date.now() + 20 * 86400000);

    const openTasks = [
      { assignedTo: 'alice', estimatedHours: 4, dueDate: soon },   // urgent: 4 * 2 = 8
      { assignedTo: 'bob', estimatedHours: 6, dueDate: later }     // not urgent: 6 * 1 = 6
    ];

    const ranking = suggestAssignee(members, openTasks);
    const alice = ranking.find((r) => r.userId === 'alice');
    const bob = ranking.find((r) => r.userId === 'bob');
    expect(alice.workloadScore).toBe(8);
    expect(bob.workloadScore).toBe(6);
    expect(ranking[0].userId).toBe('bob'); // bob is actually less loaded despite more raw hours
  });

  test('a member with zero open tasks scores zero and ranks first', () => {
    const members = [{ userId: 'alice', name: 'Alice' }, { userId: 'bob', name: 'Bob' }];
    const openTasks = [{ assignedTo: 'bob', estimatedHours: 1, dueDate: new Date(Date.now() + 20 * 86400000) }];
    const ranking = suggestAssignee(members, openTasks);
    expect(ranking[0].userId).toBe('alice');
    expect(ranking[0].workloadScore).toBe(0);
  });
});
