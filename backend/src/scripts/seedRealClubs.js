require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Club = require('../models/Club');
const ClubMembership = require('../models/ClubMembership');

const run = async () => {
  await connectDB();

  const userCache = new Map();
  const getOrCreateUser = async (name) => {
    const slug = name.toLowerCase().replace(/[^a-z]/g, '');
    const emailAddr = slug + '@xyzmail.com';
    if (userCache.has(emailAddr)) return userCache.get(emailAddr);
    let user = await User.findOne({ email: emailAddr });
    if (!user) user = await User.create({ name, email: emailAddr, password: 'password123' });
    userCache.set(emailAddr, user);
    return user;
  };

  const clubsData = [
    { name: "Mozilla Campus Club", description: "Open source development and community building.", faculty: ["Harsha Sonune"], head: "Tanushree Kadus", joint: "Ananya Kale" },
    { name: "Aasamant: The Astronomy Club", description: "Official Astronomy club exploring space and astronomical phenomena.", faculty: ["Dipti Patil", "Mahesh Pote"], head: "Shreya Watwe", joint: "Tanya Gadwal" },
    { name: "TEDxCCOEW", description: "Independently organized TED-style events spreading impactful ideas.", faculty: ["Makarand Velankar"], head: "Tejas Gadgil", joint: "Srushti Jadhav" },
    { name: "Artificial Intelligence and Computer Vision Society (AICVS)", description: "Introduces students to AI and Computer Vision techniques.", faculty: ["Sandhya Potdar"], head: "Isha Bhagat", joint: "Ishita Lele" },
    { name: "Math Club", description: "Brings together math enthusiasts beyond the classroom.", faculty: ["Tilottama Barhate"], head: "Kuhu Kelkar", joint: "Shriya Kshirsagar" },
    { name: "Loop CCOEW", description: "Coding club focused on competitive programming and DSA.", faculty: ["Nilofer Attar"], head: "Sanjana Inapakolla", joint: "Anushka Chauhan" },
    { name: "Google Developer Student Club", description: "Community of tech enthusiasts learning Google technologies.", faculty: ["Rakhi Dongaonkar"], head: "Saniya Pawar", joint: null },
    { name: "Finance and Economics Club (FiSOC)", description: "Platform for finance and economics enthusiasts.", faculty: ["Parag Chaware"], head: "Kajal Israni", joint: null },
    { name: "Code Club", description: "Coding club improving skills and coding culture on campus.", faculty: ["Jyoti Bangare"], head: "Anagha Kumar", joint: "Anushka Kulkarni" },
    { name: "The Debating Society, CCOEW", description: "Promotes reasoning, argumentation, and public speaking.", faculty: ["Vikram Athalye"], head: "Vedika Kamane", joint: "Tanushka Nimbalkar" },
    { name: "Dance Club - Insia", description: "Platform for dance lovers to showcase their talents.", faculty: ["Nutan Deshmukh"], head: "Yukta Bhor", joint: "Aadnya Kulkarni" },
    { name: "Music Club - Swarashree", description: "Platform for music lovers to showcase their talents.", faculty: ["Sakshi Mandke"], head: "Srishti Kane", joint: null },
    { name: "Cultural Club - Kalawant", description: "Encourages participation in theatrical and art competitions.", faculty: ["Sakshi Mandke"], head: "Avani Deshpande", joint: null },
    { name: "The Happy Hours", description: "Community dedicated to mental wellness and emotional growth.", faculty: ["Gautam Chandekar"], head: "Shreya Watwe", joint: null },
    { name: "Avatri - The XR Club", description: "Explores Extended Reality (XR) and Game Development.", faculty: ["Sneha Thombre"], head: "Manali Selmokar", joint: "Siddhi Bharam" },
    { name: "Automation Club", description: "Explores automation technology, robotics, and embedded systems.", faculty: ["Manisha Narwane"], head: null, joint: null },
    { name: "AlterEco Club", description: "Green technology club promoting sustainability.", faculty: ["B V Pathak"], head: "Mansi Raina", joint: "Aahana Malla" },
    { name: "The Cybersecurity Club", description: "Explores ethical hacking, data protection, and cyber awareness.", faculty: ["Mrudul Dixit"], head: "Jagruti Kate", joint: null },
    { name: "Book Club", description: "Community for book discussions, author talks, reading challenges.", faculty: ["Jyoti Chitale"], head: "Srushti Tarate", joint: null },
    { name: "E-Cell Yukta", description: "Fosters entrepreneurial vision, backed by Wadhwani Foundation NEN.", faculty: ["Makarand Velankar"], head: "Chinmayee Randive", joint: "Preeti Hatapaki" },
  ];

  for (const c of clubsData) {
    const creator = c.head ? await getOrCreateUser(c.head) : await getOrCreateUser(c.faculty[0]);
    const existing = await Club.findOne({ name: c.name });
    const club = existing || await Club.create({ name: c.name, description: c.description, createdBy: creator._id });
    if (existing) { console.log(`Skipped (already exists): ${c.name}`); continue; }

    const memberships = [];
    for (const facultyName of c.faculty) {
      const facultyUser = await getOrCreateUser(facultyName);
      memberships.push({ clubId: club._id, userId: facultyUser._id, position: 'FACULTY_COORDINATOR' });
    }
    if (c.head) {
      const headUser = await getOrCreateUser(c.head);
      memberships.push({ clubId: club._id, userId: headUser._id, position: 'HEAD_COORDINATOR' });
    }
    if (c.joint) {
      const jointUser = await getOrCreateUser(c.joint);
      memberships.push({ clubId: club._id, userId: jointUser._id, position: 'JOINT_HEAD_COORDINATOR' });
    }
    await ClubMembership.create(memberships);
    console.log(`Created: ${c.name} (${memberships.length} coordinator${memberships.length !== 1 ? "s" : ""})`);
  }

  console.log('');
  console.log('Done. All passwords are password123.');
  console.log('Note: Automation Club has no Head Coordinator listed in the source newsletter --');
  console.log('assign one manually via the app before it can run a recruitment drive.');
  process.exit(0);
};

run().catch((err) => { console.error(err); process.exit(1); });
