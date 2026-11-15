import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

export default function AdminLoginPage({ onExitAdmin, onLoginSuccess }) {
  const { user, adminUser, isStaff, adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // If already authenticated as an administrator, immediately route to the management dashboard
  useEffect(() => {
    if (isStaff && adminUser && onLoginSuccess) {
      onLoginSuccess(adminUser);
    }
  }, [isStaff, adminUser, onLoginSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowForgotNotice(false);

    if (!email.trim() || !password) {
      setError('Please provide both your administrative email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await adminLogin(email.trim(), password);
      const authenticatedUser = res.user;

      const adminRoles = [
        'super_admin',
        'admin',
        'product_manager',
        'order_manager',
        'customer_support',
        'operator'
      ];

      if (!adminRoles.includes(authenticatedUser.role)) {
        logout();
        setError('Access Denied: Customer accounts cannot access the Administrator Portal.');
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess(authenticatedUser);
      }
    } catch (err) {
      setError(err.message || 'Invalid administrator email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-slate-100 font-sans select-none">
      <div className="w-full max-w-sm">
        {/* 1. Admin Portal Title & Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3.5 shadow-lg shadow-emerald-950/40">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Admin Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Sign in to manage store operations</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {showForgotNotice && (
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-300 text-xs space-y-1 animate-in fade-in duration-150">
              <span className="font-bold text-white block">Password Reset Support</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                For security reasons, administrator password resets must be authorized by your system administrator. Please contact your Super Admin to reset your credentials.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 2. Administrative Email Input */}
            <div>
              <label htmlFor="admin-email" className="block text-slate-300 font-semibold mb-1.5">
                Administrative Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-medium transition-colors"
                />
              </div>
            </div>

            {/* 3. Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-password" className="text-slate-300 font-semibold">
                  Password
                </label>
                {/* 5. Forgot Password Option */}
                <button
                  type="button"
                  onClick={() => setShowForgotNotice(!showForgotNotice)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-medium transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 4. Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-emerald-950/60 cursor-pointer transition-colors mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Clean Return Option for Authenticated Admin */}
          {isStaff && user && (
            <div className="pt-2 border-t border-slate-800/60 text-center">
              <button
                type="button"
                onClick={() => onLoginSuccess && onLoginSuccess(user)}
                className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Return to Dashboard ({user.role}) →
              </button>
            </div>
          )}
        </div>

        {/* Return to Customer Website Link */}
        <div className="text-center mt-6">
          <button
            onClick={onExitAdmin}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Website
          </button>
        </div>
      </div>
    </div>
  );
}
