/**
 * Critical Path Method (CPM) over an event's task dependency graph.
 *
 * Each task has a duration (estimatedHours) and a list of tasks it depends
 * on (dependsOn). This computes, for every task:
 *   - earliestStart / earliestFinish  (forward pass)
 *   - latestStart / latestFinish      (backward pass)
 *   - slack = latestStart - earliestStart
 *
 * A task with slack === 0 is on the critical path: delaying it delays the
 * whole event. This is the same technique project-scheduling tools (MS
 * Project, Primavera) use — implemented here from scratch over a Mongo-
 * backed task list rather than an in-memory toy graph.
 *
 * Throws if the dependency graph has a cycle, since CPM is only defined
 * on a DAG.
 */
function computeCriticalPath(tasks) {
  const byId = new Map(tasks.map((t) => [String(t._id), t]));
  const graph = new Map(tasks.map((t) => [String(t._id), new Set()]));
  const indegree = new Map(tasks.map((t) => [String(t._id), 0]));

  // Edge direction: dependency -> dependent (must finish before dependent can start)
  for (const t of tasks) {
    const id = String(t._id);
    for (const depRaw of t.dependsOn || []) {
      const depId = String(depRaw);
      if (!byId.has(depId)) continue; // ignore dangling refs (deleted task)
      graph.get(depId).add(id);
      indegree.set(id, indegree.get(id) + 1);
    }
  }

  // Kahn's algorithm for topological order
  const queue = [...indegree.entries()].filter(([, deg]) => deg === 0).map(([id]) => id);
  const order = [];
  const indegreeCopy = new Map(indegree);

  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const next of graph.get(id)) {
      indegreeCopy.set(next, indegreeCopy.get(next) - 1);
      if (indegreeCopy.get(next) === 0) queue.push(next);
    }
  }

  if (order.length !== tasks.length) {
    const err = new Error('Task dependency graph has a cycle — cannot compute a schedule.');
    err.code = 'CYCLE_DETECTED';
    throw err;
  }

  // Forward pass: earliest start/finish
  const earliestStart = new Map();
  const earliestFinish = new Map();
  for (const id of order) {
    const task = byId.get(id);
    const deps = (task.dependsOn || []).map(String).filter((d) => byId.has(d));
    const es = deps.length ? Math.max(...deps.map((d) => earliestFinish.get(d))) : 0;
    earliestStart.set(id, es);
    earliestFinish.set(id, es + task.estimatedHours);
  }

  const projectDuration = order.length ? Math.max(...order.map((id) => earliestFinish.get(id))) : 0;

  // Backward pass: latest start/finish
  const latestFinish = new Map();
  const latestStart = new Map();
  for (const id of [...order].reverse()) {
    const task = byId.get(id);
    const dependents = [...graph.get(id)];
    const lf = dependents.length ? Math.min(...dependents.map((d) => latestStart.get(d))) : projectDuration;
    latestFinish.set(id, lf);
    latestStart.set(id, lf - task.estimatedHours);
  }

  return order.map((id) => {
    const slack = latestStart.get(id) - earliestStart.get(id);
    return {
      taskId: id,
      earliestStart: earliestStart.get(id),
      earliestFinish: earliestFinish.get(id),
      latestStart: latestStart.get(id),
      latestFinish: latestFinish.get(id),
      slack,
      isCritical: slack === 0
    };
  }).sort((a, b) => a.earliestStart - b.earliestStart);
}

module.exports = { computeCriticalPath };
