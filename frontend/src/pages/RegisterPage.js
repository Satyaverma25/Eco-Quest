import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { AVATARS } from '../utils/constants';

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (s === 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
  if (s === 3) return { score: 3, label: 'Good', color: '#3b82f6' };
  return { score: 4, label: 'Strong', color: '#10b981' };
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateField(name, value) {
  switch (name) {
    case 'username':
      if (!value.trim()) return 'Username is required';
      if (value.trim().length < 3) return 'Minimum 3 characters';
      if (value.trim().length > 20) return 'Maximum 20 characters';
      return '';
    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
      if (!value.toLowerCase().endsWith('@gmail.com')) return 'Only @gmail.com addresses are allowed';
      return '';
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Minimum 6 characters';
      return '';
    case 'studentType':
      if (!value) return 'Please select your student type';
      return '';
    default:
      return '';
  }
}

// ── Success Popup ─────────────────────────────────────────────────────────────
function SuccessPopup({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: 2 }}
          className="text-6xl mb-4"
        >
          🎉
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          You have been registered successfully 🌱<br />
          Please log in to start your EcoQuest journey.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all"
        >
          Go to Login →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Main Register Page ─────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '', email: '', password: '', avatar: '🌱', studentType: '', institution: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const strength = getStrength(form.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
    setApiError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleStudentType = (type) => {
    setForm(f => ({ ...f, studentType: type }));
    setTouched(t => ({ ...t, studentType: true }));
    setFieldErrors(prev => ({ ...prev, studentType: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const fields = ['username', 'email', 'password', 'studentType'];
    const errs = {};
    fields.forEach(f => { errs[f] = validateField(f, form[f]); });
    setFieldErrors(errs);
    setTouched({ username: true, email: true, password: true, studentType: true });
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      await register(form.username.trim(), form.email.trim(), form.password, form.avatar, form.studentType, form.institution.trim());
      setShowSuccess(true); // show popup
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field) =>
    `w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-900 outline-none transition-all
    ${touched[field] && fieldErrors[field]
      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
      : touched[field] && form[field]
      ? 'border-green-400 focus:ring-2 focus:ring-green-200'
      : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200'}`;

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* ── Success popup ── */}
      <AnimatePresence>
        {showSuccess && <SuccessPopup onClose={() => navigate('/login')} />}
      </AnimatePresence>

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-green-600 to-green-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {/* Subtle leaf pattern */}
          {['🌿','🍃','🌱','🌲','🦋','🌊'].map((emoji, i) => (
            <div key={i} className="absolute text-6xl opacity-30 select-none"
              style={{ top: `${10 + i * 15}%`, left: `${5 + (i % 3) * 30}%`, transform: `rotate(${i * 20}deg)` }}>
              {emoji}
            </div>
          ))}
        </div>
        <div className="relative z-10 text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-8xl mb-6"
          >
            🌍
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-4">Join EcoQuest</h1>
          <p className="text-white/80 text-lg max-w-xs leading-relaxed mb-8">
            Start your environmental education journey. Earn XP, unlock badges, and make a real difference.
          </p>
          <div className="space-y-2 text-left">
            {[
              ['🏆', 'Compete on Leaderboards'],
              ['📚', 'School & College Quizzes'],
              ['🎯', 'Complete Eco Missions'],
              ['🌿', 'Log Real-World Actions'],
              ['🏅', 'Earn 10 Unique Badges'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5 border border-white/20">
                <span className="text-lg">{icon}</span>
                <span className="text-white text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-6">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <span className="text-5xl">🌍</span>
            <h1 className="text-2xl font-bold text-green-700 mt-2">EcoQuest</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-1">Create Account</h2>
          <p className="text-gray-500 mb-7">Join thousands of eco-learners today</p>

          {apiError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>{apiError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Avatar Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Choose your avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(av => (
                  <motion.button
                    key={av} type="button"
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setForm(f => ({ ...f, avatar: av }))}
                    className={`text-2xl p-2 rounded-xl transition-all border-2 ${
                      form.avatar === av
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {av}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <input type="text" name="username" placeholder="e.g. EcoHero123"
                value={form.username} onChange={handleChange} onBlur={handleBlur}
                className={inputCls('username')} autoComplete="username" />
              {touched.username && fieldErrors.username &&
                <p className="mt-1.5 text-xs text-red-500">⚠ {fieldErrors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Gmail Address <span className="text-red-500">*</span>
              </label>
              <input type="email" name="email" placeholder="yourname@gmail.com"
                value={form.email} onChange={handleChange} onBlur={handleBlur}
                className={inputCls('email')} autoComplete="email" />
              {touched.email && fieldErrors.email
                ? <p className="mt-1.5 text-xs text-red-500">⚠ {fieldErrors.email}</p>
                : <p className="mt-1.5 text-xs text-gray-400">🔒 Only @gmail.com addresses are accepted</p>
              }
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password"
                  placeholder="Minimum 6 characters"
                  value={form.password} onChange={handleChange} onBlur={handleBlur}
                  className={`${inputCls('password')} pr-10`} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {touched.password && fieldErrors.password &&
                <p className="mt-1.5 text-xs text-red-500">⚠ {fieldErrors.password}</p>}
              {/* Strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength.score ? strength.color : '#e5e7eb' }} />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strength.color }}>
                    {strength.label} password
                  </p>
                </div>
              )}
            </div>

            {/* Student Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'School Student', icon: '📚', sub: 'Grade 1–12' },
                  { value: 'College Student', icon: '🎓', sub: 'UG / PG / PhD' },
                ].map(opt => (
                  <motion.button key={opt.value} type="button"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleStudentType(opt.value)}
                    className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center ${
                      form.studentType === opt.value
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                    }`}>
                    {form.studentType === opt.value && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">✓</span>
                    )}
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm font-semibold text-gray-800">{opt.value}</span>
                    <span className="text-xs text-gray-400">{opt.sub}</span>
                  </motion.button>
                ))}
              </div>
              {touched.studentType && fieldErrors.studentType &&
                <p className="mt-2 text-xs text-red-500">⚠ {fieldErrors.studentType}</p>}
            </div>

            {/* Institution (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                🏫 School / College Name <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input type="text" name="institution"
                placeholder="e.g. Lovely Professional University"
                value={form.institution} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-200"
                autoComplete="organization" />
            </div>

            {/* Submit */}
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-3 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>🌱</motion.span>
                    Creating account...
                  </span>
                : '🚀 Create My Account'
              }
            </motion.button>

          </form>

          <p className="text-center mt-6 text-gray-500 text-sm">
            Already a member?{' '}
            <Link to="/login" className="text-green-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
