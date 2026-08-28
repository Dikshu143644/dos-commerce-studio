import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, ShoppingBag, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('customer@doscommerce.in');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');

  const { user, loginCustomer, loginDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/store';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await loginCustomer(email, password);
      if (res.success) {
        toast.success(`Welcome back! Logged in as ${email}`);
        navigate(from, { replace: true });
      } else {
        toast.error(res.error || 'Failed to log in');
      }
    } catch {
      toast.error('Login failed, please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleOAuth = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      loginDemo('client');
      toast.success('Signed in securely with Google Account!');
      setIsSubmitting(false);
      navigate(from, { replace: true });
    }, 600);
  };

  const handleQuickCustomer = () => {
    loginDemo('client');
    toast.success('Signed in as Verified Customer (Rohan Mehra)');
    navigate(from, { replace: true });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#F8F7FC] via-[#F3EEFA] to-[#FFFFFF] px-4 py-10 font-sans">
      {/* Floating Spatial Purple & Orange Ambient Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-orange-500/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 right-10 w-72 h-72 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[480px] rounded-[24px] bg-white/80 backdrop-blur-2xl p-8 sm:p-10 border border-purple-100 shadow-[0_20px_60px_rgba(124,58,237,0.12)] text-[#1A1A2E]"
      >
        {/* Brand Header */}
        <div className="text-center mb-7">
          <Link to="/store" className="inline-flex items-center gap-2.5 mb-3 group cursor-pointer">
            <div className="h-12 w-12 rounded-[16px] bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white font-black text-2xl group-hover:scale-105 transition-transform">
              D
            </div>
            <div className="text-left">
              <span className="text-2xl font-black tracking-tight text-[#1A1A2E] leading-none block">
                DOS <span className="text-orange-500">COMMERCE</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">Customer Store Door</span>
            </div>
          </Link>
          <h1 className="text-xl font-bold text-[#1A1A2E] mt-1">Customer Sign In</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Log in to manage orders, track live shipments, and checkout with saved GST billing.
          </p>
        </div>

        {/* 1-Click Fast Customer Demo Banner */}
        <div className="mb-6 rounded-[18px] border border-purple-200/80 bg-purple-50/60 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" /> 1-CLICK CUSTOMER ACCESS
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-800">
              Instant Shop
            </span>
          </div>
          <p className="text-xs text-purple-700/90 mb-3">
            Quickly test the buyer portal, cart checkout, and Amazon-style tracking.
          </p>
          <Button
            type="button"
            onClick={handleQuickCustomer}
            className="w-full h-10 rounded-[14px] bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4" /> Continue as Rohan Mehra (Buyer)
          </Button>
        </div>

        {/* Google OAuth Button */}
        <Button
          type="button"
          onClick={handleGoogleOAuth}
          disabled={isSubmitting}
          className="w-full h-11 rounded-[14px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-sm shadow-sm flex items-center justify-center gap-3 mb-4 cursor-pointer"
        >
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
          Continue with Google
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-bold">Or with email / OTP</span>
          </div>
        </div>

        {/* Email & Password / OTP Form */}
        <form onSubmit={handleCustomerLogin} className="space-y-4">
          <div>
            <Label className="text-xs font-bold text-slate-700 block mb-1.5">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="pl-10 h-11 rounded-[12px] bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-purple-500 text-sm"
                required
              />
            </div>
          </div>

          {!showOtpInput ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-bold text-slate-700">Password</Label>
                <button
                  type="button"
                  onClick={() => setShowOtpInput(true)}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer"
                >
                  Sign in with OTP instead
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-11 rounded-[12px] bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-purple-500 text-sm"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-bold text-slate-700">One-Time Password (OTP)</Label>
                <button
                  type="button"
                  onClick={() => setShowOtpInput(false)}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer"
                >
                  Use Password instead
                </button>
              </div>
              <Input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP (e.g. 542891)"
                className="h-11 rounded-[12px] bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-purple-500 text-sm tracking-widest font-mono"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-[14px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In to Store'} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Door Switch Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5 text-center text-xs text-slate-500">
          <div>
            Don't have a customer account?{' '}
            <Link to="/register" className="font-bold text-purple-600 hover:underline">
              Create Customer Account
            </Link>
          </div>
          <div className="p-2.5 rounded-[12px] bg-slate-100/70 border border-slate-200/60 flex items-center justify-between">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-orange-500" /> Are you Staff, Manager, or Admin?
            </span>
            <Link
              to="/staff-login"
              className="font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
            >
              Staff Login Door &rarr;
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
