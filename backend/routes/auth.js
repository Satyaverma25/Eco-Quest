const express = require('express');
const router = express.Router();
const { register, registerTeacher, login, teacherLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Student
router.post('/register', register);
router.post('/login', login);

// Teacher
router.post('/register-teacher', registerTeacher);
router.post('/teacher-login', teacherLogin);

// Protected
router.get('/me', protect, getMe);

module.exports = router;
