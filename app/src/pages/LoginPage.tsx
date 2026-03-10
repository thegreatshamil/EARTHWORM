import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Sprout, ArrowRight, Chrome, Code } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Page } from '@/types';

interface LoginPageProps {
  onPageChange: (page: Page) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onPageChange }) => {
  const { login, loginWithGoogle, devSkipAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      onPageChange('home');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await loginWithGoogle();
      onPageChange('home');
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevSkip = () => {
    devSkipAuth();
    onPageChange('home');
  };

  return (
    <div className="min-h-screen bg-[#28282B] flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#f4d03f]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#f4d03f]/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#f4d03f] to-[#d4ac0d] flex items-center justify-center shadow-lg shadow-[#f4d03f]/20">
            <Sprout className="w-8 h-8 text-[#28282B]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome Back</h1>
          <p className="text-white/50 text-sm">Sign in to continue to Earthworm</p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="
                    w-full bg-white/5 border border-white/10 rounded-xl
                    pl-12 pr-4 py-3 text-white placeholder-white/30
                    focus:outline-none focus:border-[#f4d03f]/50 focus:ring-1 focus:ring-[#f4d03f]/30
                    transition-all
                  "
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="
                    w-full bg-white/5 border border-white/10 rounded-xl
                    pl-12 pr-4 py-3 text-white placeholder-white/30
                    focus:outline-none focus:border-[#f4d03f]/50 focus:ring-1 focus:ring-[#f4d03f]/30
                    transition-all
                  "
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="
                w-full flex items-center justify-center gap-2
                px-6 py-3 bg-gradient-to-r from-[#f4d03f] to-[#d4ac0d] text-[#28282B]
                rounded-xl font-semibold
                hover:shadow-lg hover:shadow-[#f4d03f]/30
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#28282B]/30 border-t-[#28282B] rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/40 text-sm">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google Login */}
          <motion.button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              w-full flex items-center justify-center gap-3
              px-6 py-3 bg-white/5 border border-white/10
              rounded-xl text-white
              hover:bg-white/10 hover:border-white/20
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </motion.button>
        </motion.div>

        {/* Dev Skip Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <button
            onClick={handleDevSkip}
            className="
              inline-flex items-center gap-2
              px-4 py-2 text-white/40 text-sm
              hover:text-[#f4d03f] transition-colors
            "
          >
            <Code className="w-4 h-4" />
            Dev: Skip Authentication
          </button>
        </motion.div>

        {/* Register Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center text-white/50 text-sm"
        >
          Don't have an account?{' '}
          <button
            onClick={() => onPageChange('register')}
            className="text-[#f4d03f] hover:underline font-medium"
          >
            Sign up
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
