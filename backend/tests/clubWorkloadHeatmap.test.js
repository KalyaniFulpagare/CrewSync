const { buildClubHeatmap } = require('../src/utils/clubWorkloadHeatmap');

describe('buildClubHeatmap', () => {
  test('a member loaded across multiple events is correctly flagged HIGH, not missed', () => {
    const members = [
      { userId: 'alice', name: 'Alice' },
      { userId: 'bob', name: 'Bob' }
    ];
    const farFuture = new Date(Date.now() + 20 * 86400000);
    // Alice's load is split across two different events but should still sum.
    const tasksAcrossClub = [
      { assignedTo: 'alice', estimatedHours: 4, dueDate: farFuture }, // event A
      { assignedTo: 'alice', estimatedHours: 4, dueDate: farFuture }, // event B
      { assignedTo: 'bob', estimatedHours: 1, dueDate: farFuture }
    ];

    const heatmap = buildClubHeatmap(members, tasksAcrossClub);
    const alice = heatmap.find((h) => h.userId === 'alice');
    const bob = heatmap.find((h) => h.userId === 'bob');

    expect(alice.band).toBe('HIGH');
    expect(bob.band).toBe('LOW');
  });

  test('a member with zero tasks anywhere in the club is LOW', () => {
    const members = [{ userId: 'alice', name: 'Alice' }, { userId: 'idle', name: 'Idle Member' }];
    const tasksAcrossClub = [{ assignedTo: 'alice', estimatedHours: 3, dueDate: new Date(Date.now() + 20 * 86400000) }];
    const heatmap = buildClubHeatmap(members, tasksAcrossClub);
    expect(heatmap.find((h) => h.userId === 'idle').band).toBe('LOW');
  });

  test('all members idle produces an all-LOW heatmap without dividing by zero', () => {
    const members = [{ userId: 'a', name: 'A' }, { userId: 'b', name: 'B' }];
    const heatmap = buildClubHeatmap(members, []);
    expect(heatmap.every((h) => h.band === 'LOW')).toBe(true);
    expect(heatmap.every((h) => Number.isFinite(h.workloadScore))).toBe(true);
  });
});
