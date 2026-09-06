const RecruitmentDrive = require('../models/RecruitmentDrive');
const Application = require('../models/Application');
const TeamMembership = require('../models/TeamMembership');
const Team = require('../models/Team');

exports.createDrive = async (req, res) => {
  try {
    const { title, description, teams, questions, closesAt } = req.body;
    if (!teams || teams.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one team this drive is recruiting for.' });
    }
    const validTeams = await Team.find({ _id: { $in: teams }, clubId: req.params.clubId });
    if (validTeams.length !== teams.length) {
      return res.status(400).json({ success: false, message: 'One or more teams do not belong to this club.' });
    }
    const drive = await RecruitmentDrive.create({
      clubId: req.params.clubId,
      title,
      description,
      teams,
      questions: questions || [],
      closesAt: closesAt || undefined,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, drive });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.listOpenDrives = async (req, res) => {
  try {
    const drives = await RecruitmentDrive.find({ status: 'OPEN' })
      .populate('clubId', 'name')
      .populate('teams', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, drives });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listClubDrives = async (req, res) => {
  try {
    const drives = await RecruitmentDrive.find({ clubId: req.params.clubId })
      .populate('teams', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, drives });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDrive = async (req, res) => {
  try {
    const drive = await RecruitmentDrive.findById(req.params.driveId)
      .populate('clubId', 'name')
      .populate('teams', 'name');
    if (!drive) return res.status(404).json({ success: false, message: 'Recruitment drive not found.' });
    res.status(200).json({ success: true, drive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateDriveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['OPEN', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be OPEN or CLOSED.' });
    }
    req.drive.status = status;
    await req.drive.save();
    res.status(200).json({ success: true, drive: req.drive });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.applyToDrive = async (req, res) => {
  try {
    const drive = await RecruitmentDrive.findById(req.params.driveId);
    if (!drive) return res.status(404).json({ success: false, message: 'Recruitment drive not found.' });
    if (drive.status !== 'OPEN') return res.status(400).json({ success: false, message: 'This recruitment drive is closed.' });

    const { teamId, answers } = req.body;
    if (!drive.teams.some((t) => String(t) === String(teamId))) {
      return res.status(400).json({ success: false, message: 'That team is not part of this drive.' });
    }

    const existing = await Application.findOne({ driveId: drive._id, applicantId: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already applied to this drive.' });

    const missingRequired = (drive.questions || []).find(
      (q) => q.required && !(answers || []).some((a) => a.questionLabel === q.label && a.value?.trim())
    );
    if (missingRequired) {
      return res.status(400).json({ success: false, message: `"${missingRequired.label}" is required.` });
    }

    const application = await Application.create({
      driveId: drive._id,
      applicantId: req.user._id,
      teamId,
      answers: answers || []
    });
    res.status(201).json({ success: true, application });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'You have already applied to this drive.' });
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.listMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicantId: req.user._id })
      .populate({ path: 'driveId', select: 'title clubId', populate: { path: 'clubId', select: 'name' } })
      .populate('teamId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listDriveApplications = async (req, res) => {
  try {
    const query = { driveId: req.params.driveId };
    if (!req.driveAccess.isCoordinator) {
      query.teamId = { $in: req.driveAccess.leadTeamIds };
    }
    const applications = await Application.find(query)
      .populate('applicantId', 'name email')
      .populate('teamId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const application = await Application.findOne({ _id: req.params.applicationId, driveId: req.params.driveId });
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });

    if (!req.driveAccess.isCoordinator && !req.driveAccess.leadTeamIds.includes(String(application.teamId))) {
      return res.status(403).json({ success: false, message: 'You can only review applicants for your own team.' });
    }

    application.status = status;
    await application.save();

    if (status === 'SELECTED') {
      const alreadyMember = await TeamMembership.findOne({ teamId: application.teamId, userId: application.applicantId });
      if (!alreadyMember) {
        await TeamMembership.create({
          teamId: application.teamId,
          userId: application.applicantId,
          role: 'MEMBER',
          status: 'ACCEPTED'
        });
      }
    }

    res.status(200).json({ success: true, application });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
