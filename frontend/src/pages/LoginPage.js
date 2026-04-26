import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const MODES = [
  { key: 'student', label: 'Student Login', icon: '📚', grad: 'from-green-600 to-green-700' },
  { key: 'teacher', label: 'Teacher Login', icon: '🎓', grad: 'from-purple-600 to-purple-700' },
];

function validateEmail(v) {
  if (!v.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email';
  if (!v.toLowerCase().endsWith('@gmail.com')) return 'Only @gmail.com is allowed';
  return '';
}

export default function LoginPage() {
  const { login, teacherLogin } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setApiError('');
    setForm({ email: '', password: '' });
    setTouched({});
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (touched[name]) {
      setErrors(p => ({ ...p, [name]: name === 'email' ? validateEmail(value) : (!value ? 'Required' : '') }));
    }
    setApiError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    setErrors(p => ({ ...p, [name]: name === 'email' ? validateEmail(value) : (!value ? 'Required' : '') }));
  };

  const validate = () => {
    const e = {
      email: validateEmail(form.email),
      password: form.password ? '' : 'Password is required',
    };
    setErrors(e);
    setTouched({ email: true, password: true });
    return !Object.values(e).some(Boolean);
  };

  const inputCls = (f) =>
    `w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-900 outline-none transition-all
    ${touched[f] && errors[f] ? 'border-red-400 focus:ring-2 focus:ring-red-200'
      : touched[f] && form[f] ? 'border-green-400 focus:ring-2 focus:ring-green-200'
      : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200'}`;

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setApiError('');
    try {
      await login(form.email.trim(), form.password);
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setApiError('');
    try {
      await teacherLogin(form.email.trim(), form.password);
      navigate('/teacher');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const currentMode = MODES.find(m => m.key === mode);

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* ── Left decorative panel ── */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${currentMode.grad} flex-col items-center justify-center p-12 relative overflow-hidden transition-all duration-500`}>
        <div className="relative z-10 text-center">
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-8xl mb-6"
          >
            {mode === 'teacher' ? '🎓' : '🌍'}
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {mode === 'teacher' ? 'EcoQuest for Teachers' : 'Welcome to EcoQuest'}
          </h1>
          <p className="text-white/80 text-lg max-w-sm leading-relaxed">
            {mode === 'teacher'
              ? 'Create quizzes, review student activities and track class progress.'
              : 'Learn, earn, and protect our planet through gamified environmental education.'}
          </p>
          <div className="mt-8 flex flex-col gap-2">
            {mode === 'teacher'
              ? ['📝 Create custom quizzes', '✅ Review student activities', '📊 Track learning analytics', '🏆 Manage missions'].map(i => (
                  <div key={i} className="bg-white/10 rounded-xl px-4 py-2.5 text-white text-sm border border-white/20 text-left">{i}</div>
                ))
              : ['🏆 Leaderboards', '🎯 Eco Missions', '📚 Topic Quizzes', '🌿 Activity Logger'].map(i => (
                  <div key={i} className="bg-white/10 rounded-xl px-4 py-2.5 text-white text-sm border border-white/20 text-left">{i}</div>
                ))
            }
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-4">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-5xl">{mode === 'teacher' ? '🎓' : '🌍'}</span>
            <h1 className="text-2xl font-bold text-green-700 mt-2">EcoQuest</h1>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-xl">
            {MODES.map(m => (
              <button key={m.key} onClick={() => switchMode(m.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === m.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <span>{m.icon}</span>{m.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── Student Login ── */}
            {mode === 'student' && (
              <motion.div key="student"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Sign in</h2>
                <p className="text-gray-500 mb-7">Continue your environmental journey</p>

                {apiError && (
                  <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
                    <span>⚠️</span><span>{apiError}</span>
                  </div>
                )}

                <form onSubmit={handleStudentLogin} noValidate className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Gmail Address *</label>
                    <input type="email" name="email" placeholder="yourname@gmail.com"
                      value={form.email} onChange={handleChange} onBlur={handleBlur}
                      className={inputCls('email')} autoComplete="email" autoFocus />
                    {touched.email && errors.email && <p className="mt-1.5 text-xs text-red-500">⚠ {errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} name="password" placeholder="Enter your password"
                        value={form.password} onChange={handleChange} onBlur={handleBlur}
                        className={`${inputCls('password')} pr-10`} autoComplete="current-password" />
                      <button type="button" onClick={() => setShowPass(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {touched.password && errors.password && <p className="mt-1.5 text-xs text-red-500">⚠ {errors.password}</p>}
                  </div>
                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full py-3 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-60 transition-all mt-2">
                    {loading ? '⏳ Signing in...' : '🔓 Sign In'}
                  </motion.button>
                </form>

                <p className="text-center mt-6 text-gray-500 text-sm">
                  New to EcoQuest?{' '}
                  <Link to="/register" className="text-green-600 font-semibold hover:underline">Create account</Link>
                </p>
              </motion.div>
            )}

            {/* ── Teacher Login ── */}
            {mode === 'teacher' && (
              <motion.div key="teacher"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Teacher Sign In</h2>
                <p className="text-gray-500 mb-7">Access your teacher dashboard</p>

                {apiError && (
                  <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
                    <span>⚠️</span><span>{apiError}</span>
                  </div>
                )}

                <form onSubmit={handleTeacherLogin} noValidate className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Gmail Address *</label>
                    <input type="email" name="email" placeholder="yourname@gmail.com"
                      value={form.email} onChange={handleChange} onBlur={handleBlur}
                      className={inputCls('email')} autoComplete="email" autoFocus />
                    {touched.email && errors.email && <p className="mt-1.5 text-xs text-red-500">⚠ {errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} name="password" placeholder="Enter your password"
                        value={form.password} onChange={handleChange} onBlur={handleBlur}
                        className={`${inputCls('password')} pr-10`} autoComplete="current-password" />
                      <button type="button" onClick={() => setShowPass(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {touched.password && errors.password && <p className="mt-1.5 text-xs text-red-500">⚠ {errors.password}</p>}
                  </div>
                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full py-3 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-60 transition-all">
                    {loading ? '⏳ Signing in...' : '🎓 Sign In as Teacher'}
                  </motion.button>
                </form>

                <p className="text-center mt-5 text-gray-500 text-sm">
                  New teacher?{' '}
                  <Link to="/teacher/register" className="text-purple-600 font-semibold hover:underline">Create teacher account</Link>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
