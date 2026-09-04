const request = require('supertest');
const { app } = require('../src/server');
const User = require('../src/models/User');
const Event = require('../src/models/Event');
const EventMember = require('../src/models/EventMember');
const Task = require('../src/models/Task');

const setupEventWithMember = async () => {
  const head = await User.create({ name: 'Head', email: 'head@test.com', password: 'password123' });
  const login = await request(app).post('/api/auth/login').send({ email: 'head@test.com', password: 'password123' });
  const event = await Event.create({
    title: 'Test Event', description: '', clubId: head._id, // clubId not enforced by a real Club doc for this isolated test
    eventDate: new Date(Date.now() + 86400000), venue: 'Hall', createdBy: head._id, host: head._id
  });
  await EventMember.create({ eventId: event._id, userId: head._id, role: 'HEAD', status: 'ACCEPTED' });
  return { token: login.body.token, event, head };
};

describe('Optimistic locking on task status updates', () => {
  test('a stale expectedVersion is rejected with 409 instead of silently overwriting', async () => {
    const { token, event, head } = await setupEventWithMember();
    const task = await Task.create({ eventId: event._id, title: 'Task A', dueDate: new Date(Date.now() + 86400000), createdBy: head._id });

    // First update succeeds and bumps the version.
    const first = await request(app)
      .patch(`/api/tasks/item/${task._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS', expectedVersion: task.__v });
    expect(first.status).toBe(200);

    // Second update still claims the OLD version — must be rejected, not applied.
    const stale = await request(app)
      .patch(`/api/tasks/item/${task._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DONE', expectedVersion: task.__v });
    expect(stale.status).toBe(409);

    const finalTask = await Task.findById(task._id);
    expect(finalTask.status).toBe('IN_PROGRESS'); // the stale write did NOT win
  });

  test('a correctly up-to-date expectedVersion succeeds', async () => {
    const { token, event, head } = await setupEventWithMember();
    const task = await Task.create({ eventId: event._id, title: 'Task B', dueDate: new Date(Date.now() + 86400000), createdBy: head._id });

    const res = await request(app)
      .patch(`/api/tasks/item/${task._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DONE', expectedVersion: task.__v });
    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('DONE');
  });
});

describe('Task dependency validation on creation', () => {
  test('rejects a dependsOn referencing a task ID that does not exist', async () => {
    const { token, event } = await setupEventWithMember();
    const fakeId = '64a000000000000000000000';
    const res = await request(app)
      .post(`/api/tasks/${event._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Dependent task', dueDate: new Date(Date.now() + 86400000), dependsOn: [fakeId] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/do not exist/i);
  });

  test('rejects a dependsOn referencing a task from a DIFFERENT event', async () => {
    const { token, event, head } = await setupEventWithMember();
    const otherEvent = await Event.create({
      title: 'Other Event', description: '', clubId: head._id,
      eventDate: new Date(Date.now() + 86400000), venue: 'Hall', createdBy: head._id, host: head._id
    });
    const foreignTask = await Task.create({ eventId: otherEvent._id, title: 'Foreign task', dueDate: new Date(Date.now() + 86400000), createdBy: head._id });

    const res = await request(app)
      .post(`/api/tasks/${event._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Dependent task', dueDate: new Date(Date.now() + 86400000), dependsOn: [foreignTask._id] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/same event/i);
  });

  test('accepts a valid dependsOn on a task within the same event', async () => {
    const { token, event, head } = await setupEventWithMember();
    const prereq = await Task.create({ eventId: event._id, title: 'Prereq', dueDate: new Date(Date.now() + 86400000), createdBy: head._id });

    const res = await request(app)
      .post(`/api/tasks/${event._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Dependent task', dueDate: new Date(Date.now() + 86400000), dependsOn: [prereq._id] });
    expect(res.status).toBe(201);
  });
});

describe('Task assignment and dependency workflow', () => {
  test('does not assign a task to someone who is not an accepted event member', async () => {
    const { token, event, head } = await setupEventWithMember();
    const outsider = await User.create({ name: 'Outsider', email: 'outsider@test.com', password: 'password123' });
    const task = await Task.create({ eventId: event._id, title: 'Task', dueDate: new Date(Date.now() + 86400000), createdBy: head._id });

    const res = await request(app)
      .patch(`/api/tasks/item/${task._id}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: outsider._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/accepted event members/i);
  });

  test('does not start a task before its dependencies are complete', async () => {
    const { token, event, head } = await setupEventWithMember();
    const prerequisite = await Task.create({ eventId: event._id, title: 'Prerequisite', dueDate: new Date(Date.now() + 86400000), createdBy: head._id });
    const dependent = await Task.create({ eventId: event._id, title: 'Dependent', dueDate: new Date(Date.now() + 86400000), dependsOn: [prerequisite._id], createdBy: head._id });

    const res = await request(app)
      .patch(`/api/tasks/item/${dependent._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS', expectedVersion: dependent.__v });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/dependencies/i);
  });
});
