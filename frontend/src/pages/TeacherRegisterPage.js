import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

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

function validateField(name, value) {
  switch (name) {
    case 'name':
      if (!value.trim()) return 'Full name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      return '';
    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
      if (!value.toLowerCase().endsWith('@gmail.com')) return 'Only Gmail addresses (@gmail.com) are allowed';
      return '';
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      return '';
    default:
      return '';
  }
}

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
          Your teacher account has been created successfully 🎓<br />
          Please log in to access your dashboard.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all"
        >
          Go to Login →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default function TeacherRegisterPage() {
  const { registerTeacher } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', institution: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const strength = getStrength(form.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (touched[name]) setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    setApiError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = {};
    ['name', 'email', 'password'].forEach(f => { errs[f] = validateField(f, form[f]); });
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      await registerTeacher(form.name.trim(), form.email.trim(), form.password, form.institution.trim());
      setShowSuccess(true);
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
      ? 'border-purple-400 focus:ring-2 focus:ring-purple-200'
      : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'}`;

  return (
    <div className="min-h-screen flex bg-gray-50">

      <AnimatePresence>
        {showSuccess && <SuccessPopup onClose={() => navigate('/login')} />}
      </AnimatePresence>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-purple-600 to-purple-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="relative z-10 text-center">
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="text-8xl mb-6">
            🎓
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-4">Join as a Teacher</h1>
          <p className="text-white/80 text-lg max-w-xs leading-relaxed mb-8">
            Empower your students with gamified environmental education.
          </p>
          <div className="space-y-2 text-left">
            {[
              ['📝', 'Create custom quizzes for your class'],
              ['✅', 'Review & approve student activities'],
              ['📊', 'Track progress with analytics'],
              ['🎯', 'Assign eco missions to students'],
              ['🏆', 'Monitor leaderboard performance'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5 border border-white/20">
                <span className="text-lg">{icon}</span>
                <span className="text-white text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-6">

          <div className="lg:hidden text-center mb-6">
            <span className="text-5xl">🎓</span>
            <h1 className="text-2xl font-bold text-purple-600 mt-2">EcoQuest Teacher</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-1">Teacher Sign Up</h2>
          <p className="text-gray-500 mb-7">Create your teacher account to get started</p>

          {apiError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
              <span className="flex-shrink-0">⚠️</span><span>{apiError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" placeholder="Dr. Priya Sharma"
                value={form.name} onChange={handleChange} onBlur={handleBlur}
                className={inputCls('name')} autoComplete="name" autoFocus />
              {touched.name && fieldErrors.name && <p className="mt-1.5 text-xs text-red-500">⚠ {fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gmail Address <span className="text-red-500">*</span></label>
              <input type="email" name="email" placeholder="yourname@gmail.com"
                value={form.email} onChange={handleChange} onBlur={handleBlur}
                className={inputCls('email')} autoComplete="email" />
              {touched.email && fieldErrors.email
                ? <p className="mt-1.5 text-xs text-red-500">⚠ {fieldErrors.email}</p>
                : <p className="mt-1.5 text-xs text-gray-400">🔒 Only @gmail.com addresses are accepted</p>}
            </div>

            {/* Institution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                🏫 School / College Name <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input type="text" name="institution" placeholder="e.g. Lovely Professional University"
                value={form.institution} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                autoComplete="organization" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" placeholder="Minimum 6 characters"
                  value={form.password} onChange={handleChange} onBlur={handleBlur}
                  className={`${inputCls('password')} pr-10`} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {touched.password && fieldErrors.password && <p className="mt-1.5 text-xs text-red-500">⚠ {fieldErrors.password}</p>}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength.score ? strength.color : '#e5e7eb' }} />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label} password</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" placeholder="Re-enter your password"
                  value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                  className={`${inputCls('confirmPassword')} pr-10`} autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {touched.confirmPassword && fieldErrors.confirmPassword &&
                <p className="mt-1.5 text-xs text-red-500">⚠ {fieldErrors.confirmPassword}</p>}
              {touched.confirmPassword && !fieldErrors.confirmPassword && form.confirmPassword && form.password === form.confirmPassword &&
                <p className="mt-1.5 text-xs text-green-600">✓ Passwords match</p>}
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-3 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>🎓</motion.span>
                    Creating account...
                  </span>
                : '🎓 Create Teacher Account'
              }
            </motion.button>
          </form>

          <p className="text-center mt-6 text-gray-500 text-sm">
            Already have a teacher account?{' '}
            <Link to="/login" className="text-purple-600 font-semibold hover:underline">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
