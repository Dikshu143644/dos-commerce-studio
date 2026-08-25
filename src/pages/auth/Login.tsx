import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLoginForm } from '@/hooks/useLoginForm';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { isLoading, onSubmit } = useLoginForm();
  const { user, loginDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@stockflow.com',
      password: 'password123',
    },
  });

  const handleQuickDemo = (role: UserRole) => {
    loginDemo(role);
    toast.success(`Logged in as Demo ${role.toUpperCase()}`);
    navigate(from, { replace: true });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#020617] px-4 py-8">
      {/* Full-Screen Panoramic Cinematic Sunset Warehouse Background (Image 2) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/images/backgrounds/warehouse-sunset-drone.jpg"
          alt="StockFlow Logistics Facility"
          className="w-full h-full object-cover filter brightness-[0.9] contrast-[1.05]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=85';
          }}
        />
        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/50" />
      </div>

      {/* Frosted Glassmorphic Center Card (Pixel-Perfect to Image 2) */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[460px] rounded-[32px] bg-black/30 backdrop-blur-3xl p-8 sm:p-10 border border-white/25 shadow-[0_25px_80px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]"
      >
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-[14px] bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.5)]">
              <span className="text-2xl font-black text-black">S</span>
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">StockFlow</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back!</h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
            Inventory & CRM Management System
          </p>
        </div>

        {/* 1-Click Role Quick Access Bar */}
        <div className="mb-6 p-1.5 rounded-[16px] bg-white/[0.06] border border-white/10 flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickDemo('admin')}
            className="flex-1 py-1.5 px-2 rounded-[10px] text-xs font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 transition-all border border-emerald-500/30 text-center flex items-center justify-center gap-1"
          >
            <Sparkles className="h-3 w-3" /> Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('manager')}
            className="flex-1 py-1.5 px-2 rounded-[10px] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all text-center"
          >
            Manager
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('staff')}
            className="flex-1 py-1.5 px-2 rounded-[10px] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all text-center"
          >
            Staff
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1.5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <Input
                type="email"
                placeholder="Email"
                {...register('email')}
                className="h-12 pl-12 pr-4 bg-white/[0.07] border-white/15 rounded-[16px] text-white placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-400/20 text-sm font-medium"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-400 pl-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                {...register('password')}
                className="h-12 pl-12 pr-12 bg-white/[0.07] border-white/15 rounded-[16px] text-white placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-400/20 text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-400 pl-1">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded h-4 w-4 bg-white/10 border-white/20 text-emerald-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-slate-300 hover:text-emerald-400 transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </div>

          {/* Sign In Button (Emerald Gradient from Image 2) */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-[16px] bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] hover:from-[#059669] hover:to-[#047857] text-white font-bold text-base shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-all duration-300 mt-2"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Or Continue With Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-[#0d121c]/80 backdrop-blur-md px-3 text-xs text-slate-400 font-medium">
            or continue with
          </span>
        </div>

        {/* SSO Social Buttons (Google & Microsoft from Image 2) */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleQuickDemo('admin')}
            className="h-11 rounded-[14px] bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-white text-xs font-semibold gap-2 transition-all"
          >
            {/* Google G Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleQuickDemo('admin')}
            className="h-11 rounded-[14px] bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-white text-xs font-semibold gap-2 transition-all"
          >
            {/* Microsoft 4-Color Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#f25022" d="M1 1h10v10H1z" />
              <path fill="#00a4ef" d="M1 13h10v10H1z" />
              <path fill="#7fba00" d="M13 1h10v10H13z" />
              <path fill="#ffb900" d="M13 13h10v10H13z" />
            </svg>
            Microsoft
          </Button>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-300 mt-6">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors underline-offset-4 hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
