const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes        = require('./routes/auth');
const userRoutes        = require('./routes/users');
const quizRoutes        = require('./routes/quizzes');
const challengeRoutes   = require('./routes/challenges');
const leaderboardRoutes = require('./routes/leaderboard');
const badgeRoutes       = require('./routes/badges');
const adminRoutes       = require('./routes/admin');
const activityRoutes    = require('./routes/activities');
const missionRoutes     = require('./routes/missions');
const notifRoutes       = require('./routes/notifications');
const analyticsRoutes   = require('./routes/analytics');
const { initSocket }    = require('./socket/socketManager');

const app = express();
const server = http.createServer(app);

// ✅ Render ke liye important
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return callback(null, true);
    if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Socket.io ────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});
app.set('io', io);
initSocket(io);

// ─── Middleware ───────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});
app.use('/api/', limiter);

// ─── Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/analytics', analyticsRoutes);

// ✅ Health check (Render ke liye MUST)
app.get('/healthz', (req, res) => res.send('OK'));

app.get('/', (req, res) => {
  res.json({ message: 'EcoQuest API running 🚀' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ success: false, message: err.message });
});

// ─── Start Server ─────────────────────────────────────

// ⚠️ Important: DB fail ho tab bhi server start ho
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
  });

// ✅ Server ALWAYS start hoga (Render ke liye important)
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});