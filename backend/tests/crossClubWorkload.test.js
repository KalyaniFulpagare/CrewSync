const { buildPersonalLoad } = require('../src/utils/crossClubWorkload');

const farFuture = new Date(Date.now() + 20 * 86400000);
const task = (assignedTo, hours, clubId, clubName, dueDate = farFuture) => ({ assignedTo, estimatedHours: hours, dueDate, clubId, clubName });

describe('buildPersonalLoad (cross-club "My Total Load")', () => {
  test('the flagship case: overloaded across clubs while each club alone looks fine', () => {
    const member = { userId: 'kalz', name: 'Kalz' };
    const tasks = [
      task('kalz', 4, 'mozilla', 'Mozilla Campus Club'),
      task('kalz', 4, 'aasamant', 'Aasamant Astronomy Club'),
      task('kalz', 4, 'tedx', 'TEDxCCOEW')
    ];

    const result = buildPersonalLoad(member, tasks);

    // Each individual club only sees 4h — on its own, unremarkable.
    result.perClub.forEach((c) => expect(c.workloadScore).toBe(4));
    // But the combined total across all three clubs is 12h — genuinely high.
    expect(result.totalScore).toBe(12);
    expect(result.totalBand).toBe('HIGH');
    // The key assertion: this is a hidden overload, invisible to any single club's view.
    expect(result.hiddenOverload).toBe(true);
  });

  test('a member genuinely overloaded within ONE club is not marked as a hidden overload', () => {
    const member = { userId: 'kalz', name: 'Kalz' };
    const tasks = [task('kalz', 12, 'mozilla', 'Mozilla Campus Club')];
    const result = buildPersonalLoad(member, tasks);
    expect(result.totalBand).toBe('HIGH');
    // Mozilla's own view already shows this — nothing "hidden" about it.
    expect(result.hiddenOverload).toBe(false);
  });

  test('a lightly loaded member across clubs stays LOW overall', () => {
    const member = { userId: 'kalz', name: 'Kalz' };
    const tasks = [task('kalz', 1, 'mozilla', 'Mozilla'), task('kalz', 1, 'tedx', 'TEDx')];
    const result = buildPersonalLoad(member, tasks);
    expect(result.totalBand).toBe('LOW');
    expect(result.hiddenOverload).toBe(false);
  });

  test('ignores tasks assigned to other people', () => {
    const member = { userId: 'kalz', name: 'Kalz' };
    const tasks = [task('someone-else', 20, 'mozilla', 'Mozilla')];
    const result = buildPersonalLoad(member, tasks);
    expect(result.totalScore).toBe(0);
    expect(result.perClub).toHaveLength(0);
  });
});
