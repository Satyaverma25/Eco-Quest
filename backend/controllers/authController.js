const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { checkAndAwardBadges } = require('../utils/badgeEngine');

// ── STUDENT REGISTER ─────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { username, email, password, avatar, studentType, institution } = req.body;

    if (!username || !email || !password || !studentType) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ success: false, message: 'Only Gmail addresses (@gmail.com) are allowed' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }
    if (!['School Student', 'College Student'].includes(studentType)) {
      return res.status(400).json({ success: false, message: 'Please select a valid student type' });
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.trim() }]
    });
    if (existing) {
      const field = existing.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(400).json({ success: false, message: `${field} is already registered` });
    }

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase(),
      password,
      avatar: avatar || '🌱',
      studentType,
      institution: institution || '',
      role: 'student',
    });

    await checkAndAwardBadges(user);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Congratulations! You have been registered successfully 🎉',
    });

  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field === 'email' ? 'Email' : 'Username'} is already registered` });
    }
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ── STUDENT LOGIN ─────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ success: false, message: 'Only Gmail addresses (@gmail.com) are accepted' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email address' });
    }
    if (['teacher', 'admin'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Please use the Teacher Login tab to sign in' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    _updateStreak(user);
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Welcome back! 👋',
      token,
      user: {
        ..._userPayload(user),
        totalPoints: user.totalPoints,
        topicProgress: user.topicProgress,
        completedQuizzes: user.completedQuizzes,
        activityFeed: user.activityFeed,
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ── TEACHER REGISTER ──────────────────────────────────────────────────────────
exports.registerTeacher = async (req, res) => {
  try {
    const { name, email, password, institution } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email and password are required' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Full name must be at least 2 characters' });
    }
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ success: false, message: 'Only Gmail addresses (@gmail.com) are allowed' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    let username = name.trim().replace(/\s+/g, '').substring(0, 20);
    if (await User.findOne({ username })) {
      username = username.substring(0, 15) + Math.floor(Math.random() * 9999);
    }

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      avatar: '🎓',
      studentType: 'Teacher',
      institution: institution || '',
      role: 'teacher',
    });

    res.status(201).json({
      success: true,
      message: 'Congratulations! Your teacher account has been created successfully 🎉',
    });

  } catch (err) {
    console.error('Teacher register error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ── TEACHER LOGIN — direct, no OTP ───────────────────────────────────────────
exports.teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ success: false, message: 'Only Gmail addresses (@gmail.com) are accepted' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email address' });
    }
    if (!['teacher', 'admin'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'This login is for teachers only. Please use the Student Login tab.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    _updateStreak(user);
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: `Welcome back, ${user.username}! 🎓`,
      token,
      user: {
        ..._userPayload(user),
        totalPoints: user.totalPoints,
        topicProgress: user.topicProgress,
        completedQuizzes: user.completedQuizzes,
        activityFeed: user.activityFeed,
      },
    });

  } catch (err) {
    console.error('Teacher login error:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ── GET ME ────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('badges.badgeId')
      .populate('completedQuizzes.quizId', 'title topic difficulty');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function _userPayload(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    studentType: user.studentType,
    institution: user.institution,
    xp: user.xp,
    level: user.level,
    role: user.role,
    badges: user.badges,
    streak: user.streak,
  };
}

function _updateStreak(user) {
  const today = new Date().toDateString();
  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;
  if (lastActive !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    user.streak = lastActive === yesterday ? user.streak + 1 : 1;
    user.lastActiveDate = new Date();
  }
}
