require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Club = require('../models/Club');
const ClubMembership = require('../models/ClubMembership');
const Team = require('../models/Team');
const TeamMembership = require('../models/TeamMembership');
const Event = require('../models/Event');
const EventMember = require('../models/EventMember');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const Message = require('../models/Message');

const run = async () => {
  await connectDB();
  await Promise.all(
    [User, Club, ClubMembership, Team, TeamMembership, Event, EventMember, Task, Comment, ActivityLog, Message]
      .map((m) => m.deleteMany({}))
  );

  const headCoordinator = await User.create({ name: 'Tejas Gadgil', email: 'head@ccoew.edu', password: 'password123' });
  const jointHead = await User.create({ name: 'Srushti Jadhav', email: 'jointhead@ccoew.edu', password: 'password123' });
  const facultyCoordinator = await User.create({ name: 'Dr Makarand Velankar', email: 'faculty@ccoew.edu', password: 'password123' });
  const collegeAdmin = await User.create({ name: 'College Admin', email: 'admin@ccoew.edu', password: 'password123', role: 'FACULTY_ADMIN' });

  const designHead = await User.create({ name: 'Kalz (Design Head)', email: 'designhead@ccoew.edu', password: 'password123' });
  const designMember = await User.create({ name: 'Riya Member', email: 'riya@ccoew.edu', password: 'password123' });
  const prHead = await User.create({ name: 'Aarav (PR Head)', email: 'prhead@ccoew.edu', password: 'password123' });
  const contentMember = await User.create({ name: 'Meera Member', email: 'meera@ccoew.edu', password: 'password123' });

  const club = await Club.create({ name: 'TEDxCCOEW', description: 'Independently organized TED event bringing ideas worth spreading to campus.', createdBy: headCoordinator._id });

  await ClubMembership.create([
    { clubId: club._id, userId: facultyCoordinator._id, position: 'FACULTY_COORDINATOR' },
    { clubId: club._id, userId: headCoordinator._id, position: 'HEAD_COORDINATOR' },
    { clubId: club._id, userId: jointHead._id, position: 'JOINT_HEAD_COORDINATOR' }
  ]);

  const designTeam = await Team.create({ clubId: club._id, name: 'Design Team' });
  const prTeam = await Team.create({ clubId: club._id, name: 'PR & Sponsorship Team' });
  const contentTeam = await Team.create({ clubId: club._id, name: 'Content Creation Team' });

  await TeamMembership.create([
    { teamId: designTeam._id, userId: designHead._id, role: 'HEAD', status: 'ACCEPTED' },
    { teamId: designTeam._id, userId: designMember._id, role: 'MEMBER', status: 'ACCEPTED' },
    { teamId: prTeam._id, userId: prHead._id, role: 'HEAD', status: 'ACCEPTED' },
    { teamId: contentTeam._id, userId: contentMember._id, role: 'MEMBER', status: 'ACCEPTED' }
  ]);

  const event = await Event.create({
    title: 'Kairos — TEDxCCOEW 2026',
    description: 'Annual TEDx event — talks, logistics, and volunteer coordination.',
    clubId: club._id,
    eventDate: new Date(Date.now() + 14 * 86400000),
    venue: 'Main Auditorium',
    budget: 45000,
    host: headCoordinator._id
  });

  await EventMember.create([
    { eventId: event._id, userId: headCoordinator._id, role: 'HEAD', status: 'ACCEPTED' },
    { eventId: event._id, userId: designHead._id, role: 'MEMBER', status: 'ACCEPTED' },
    { eventId: event._id, userId: designMember._id, role: 'MEMBER', status: 'ACCEPTED' },
    { eventId: event._id, userId: prHead._id, role: 'MEMBER', status: 'ACCEPTED' },
    { eventId: event._id, userId: contentMember._id, role: 'MEMBER', status: 'ACCEPTED' }
  ]);

  const bookVenue = await Task.create({
    eventId: event._id, teamId: prTeam._id, title: 'Book auditorium slot', assignedTo: prHead._id,
    dueDate: new Date(Date.now() + 2 * 86400000), estimatedHours: 3, status: 'DONE', createdBy: headCoordinator._id
  });
  const arrangeAV = await Task.create({
    eventId: event._id, teamId: designTeam._id, title: 'Arrange AV & stage setup', assignedTo: designHead._id,
    dueDate: new Date(Date.now() + 6 * 86400000), estimatedHours: 5, dependsOn: [bookVenue._id], createdBy: headCoordinator._id
  });
  await Task.create({
    eventId: event._id, teamId: contentTeam._id, title: 'Run speaker rehearsal', assignedTo: contentMember._id,
    dueDate: new Date(Date.now() + 10 * 86400000), estimatedHours: 4, dependsOn: [arrangeAV._id], createdBy: headCoordinator._id
  });
  await Task.create({
    eventId: event._id, teamId: designTeam._id, title: 'Design social media posters', assignedTo: designMember._id,
    dueDate: new Date(Date.now() + 4 * 86400000), estimatedHours: 3, createdBy: headCoordinator._id
  });
  await Task.create({
    eventId: event._id, teamId: prTeam._id, title: 'Confirm sponsor deliverables', assignedTo: prHead._id,
    dueDate: new Date(Date.now() + 4 * 86400000), estimatedHours: 4, createdBy: headCoordinator._id
  });

  await Comment.create({ eventId: event._id, userId: headCoordinator._id, text: "Let's finalize the speaker list by Friday." });
  await ActivityLog.create({ eventId: event._id, userId: headCoordinator._id, action: 'EVENT_CREATED', meta: { title: event.title } });

  await Message.create([
    { channelType: 'CLUB', channelId: club._id, userId: headCoordinator._id, text: 'Welcome to the TEDxCCOEW hub! Post updates here.' },
    { channelType: 'TEAM', channelId: designTeam._id, userId: designHead._id, text: "Let's sync on the poster drafts today." }
  ]);

  const club2 = await Club.create({ name: 'Mozilla Campus Club', description: 'Open source development and community building.', createdBy: headCoordinator._id });
  await ClubMembership.create({ clubId: club2._id, userId: jointHead._id, position: 'HEAD_COORDINATOR' });
  const mozDesignTeam = await Team.create({ clubId: club2._id, name: 'Design Team' });
  await TeamMembership.create({ teamId: mozDesignTeam._id, userId: designHead._id, role: 'MEMBER', status: 'ACCEPTED' });

  const mozEvent = await Event.create({
    title: 'Git & GitHub Workshop',
    description: 'Hands-on workshop on version control and collaboration.',
    clubId: club2._id,
    eventDate: new Date(Date.now() + 5 * 86400000),
    venue: 'CS Lab 3',
    budget: 5000,
    host: jointHead._id
  });
  await EventMember.create({ eventId: mozEvent._id, userId: designHead._id, role: 'MEMBER', status: 'ACCEPTED' });
  await EventMember.create({ eventId: mozEvent._id, userId: contentMember._id, role: 'MEMBER', status: 'PENDING' });
  await TeamMembership.create({ teamId: mozDesignTeam._id, userId: prHead._id, role: 'MEMBER', status: 'PENDING' });
  await Task.create({
    eventId: mozEvent._id, teamId: mozDesignTeam._id, title: 'Design workshop banner & slides', assignedTo: designHead._id,
    dueDate: new Date(Date.now() + 3 * 86400000), estimatedHours: 5, createdBy: jointHead._id
  });

  console.log('Seed complete: 2 clubs, 3 coordinators, 4 teams, 2 events, 6 tasks, hub messages.');
  console.log('Login as head@ccoew.edu / password123 (Head Coordinator) to see the full picture.');
  console.log('Login as designhead@ccoew.edu / password123 to see "My Total Load" — they\'re on BOTH clubs\' Design Teams.');
  console.log('Login as meera@ccoew.edu or prhead@ccoew.edu / password123 to see a pending invite waiting on the Invites page.');
  console.log('Other logins: riya@ccoew.edu — all password123.');
  process.exit(0);
};

run().catch((err) => { console.error(err); process.exit(1); });

