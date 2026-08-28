import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, User, Briefcase, Shield, Zap, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/contexts/AuthContext';

export default function StaffLoginPage() {
  const [username, setUsername] = useState('staff_electronics');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, userRole, loginStaff, loginDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (user && userRole !== 'client' && userRole !== 'viewer') {
      navigate(from, { replace: true });
    }
  }, [user, userRole, navigate, from]);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast.error('Please enter your staff username');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await loginStaff(username, password);
      if (res.success) {
        const catMsg = res.category ? ` (Assigned Category: ${res.category})` : '';
        toast.success(`Access Granted: ${res.role?.toUpperCase()}${catMsg}`);
        navigate(from, { replace: true });
      } else {
        toast.error(res.error || 'Invalid credentials');
      }
    } catch {
      toast.error('Authentication failed, please verify your credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRole = (role: UserRole, category?: string, userLabel?: string) => {
    loginDemo(role, category);
    const catMsg = category ? ` (Locked to: ${category})` : '';
    toast.success(`Logged in as ${userLabel || role.toUpperCase()}${catMsg}`);
    navigate(from, { replace: true });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#F8F7FC] via-[#F1EBFA] to-[#FFFFFF] px-4 py-10 font-sans">
      {/* Floating Spatial Purple & Orange Ambient Orbs */}
      <div className="absolute -top-36 -right-36 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-36 -left-36 w-96 h-96 rounded-full bg-orange-500/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-10 w-64 h-64 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[520px] rounded-[24px] bg-white/85 backdrop-blur-2xl p-8 sm:p-10 border border-purple-100/90 shadow-[0_25px_70px_rgba(124,58,237,0.14)] text-[#1A1A2E]"
      >
        {/* Brand & Portal Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/30 text-white font-black text-2xl">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A1A2E]">
            DOS <span className="text-purple-600">ERP</span> & <span className="text-orange-500">CRM</span> Staff Portal
          </h1>
          <p className="mt-1 text-xs text-[#6B7280]">
            Secure operations door for Staff, Managers, and Enterprise Administrators
          </p>
        </div>

        {/* 1-Click Role Switcher Bento Grid */}
        <div className="mb-6 rounded-[20px] border border-purple-200/80 bg-purple-50/50 p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" /> SELECT INSTANT DEMO ROLE
            </span>
            <span className="rounded-full bg-purple-200/80 px-2 py-0.5 text-[10px] font-bold text-purple-800">
              Role Matrix
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Admin */}
            <button
              type="button"
              onClick={() => handleQuickRole('admin', undefined, 'Super Admin')}
              className="flex flex-col items-center justify-center rounded-[14px] border border-purple-300/80 bg-white hover:bg-purple-100/70 p-2.5 text-center transition-all cursor-pointer hover:scale-102 shadow-sm"
            >
              <Shield className="h-4 w-4 text-purple-600 mb-1" />
              <span className="text-xs font-bold text-slate-900">Admin</span>
              <span className="text-[10px] font-semibold text-purple-600">Full Master</span>
            </button>

            {/* 2. Manager */}
            <button
              type="button"
              onClick={() => handleQuickRole('manager', undefined, 'Operations Manager')}
              className="flex flex-col items-center justify-center rounded-[14px] border border-slate-200 bg-white hover:bg-slate-50 p-2.5 text-center transition-all cursor-pointer hover:scale-102 shadow-sm"
            >
              <Briefcase className="h-4 w-4 text-indigo-600 mb-1" />
              <span className="text-xs font-bold text-slate-900">Manager</span>
              <span className="text-[10px] font-semibold text-indigo-600">CRM + ERP</span>
            </button>

            {/* 3. Staff Electronics */}
            <button
              type="button"
              onClick={() => handleQuickRole('staff', 'Electronics', 'Priya (Electronics Staff)')}
              className="flex flex-col items-center justify-center rounded-[14px] border border-orange-200 bg-white hover:bg-orange-50 p-2.5 text-center transition-all cursor-pointer hover:scale-102 shadow-sm"
            >
              <Zap className="h-4 w-4 text-orange-500 mb-1" />
              <span className="text-xs font-bold text-slate-900">Staff #1</span>
              <span className="text-[10px] font-bold text-orange-600">Electronics</span>
            </button>

            {/* 4. Staff Industrial */}
            <button
              type="button"
              onClick={() => handleQuickRole('staff', 'Industrial Parts', 'Amit (Industrial Staff)')}
              className="flex flex-col items-center justify-center rounded-[14px] border border-cyan-200 bg-white hover:bg-cyan-50 p-2.5 text-center transition-all cursor-pointer hover:scale-102 shadow-sm"
            >
              <Layers className="h-4 w-4 text-cyan-600 mb-1" />
              <span className="text-xs font-bold text-slate-900">Staff #2</span>
              <span className="text-[10px] font-bold text-cyan-700">Industrial</span>
            </button>
          </div>
        </div>

        {/* Staff credentials form */}
        <form onSubmit={handleStaffLogin} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-bold text-slate-700">Staff Username or Email</Label>
              <span className="text-[11px] text-slate-400 font-mono">e.g. staff_electronics</span>
            </div>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="staff_electronics / manager_rahul"
                className="pl-10 h-11 rounded-[12px] bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-purple-500 text-sm font-medium"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-bold text-slate-700">Password</Label>
              <Link to="/forgot-password" className="text-xs font-semibold text-purple-600 hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 h-11 rounded-[12px] bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-purple-500 text-sm font-medium"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-[14px] bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Operations Console'} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Customer Door Switch Link */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Are you a public shopper or customer?</span>
          <Link
            to="/login"
            className="font-bold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
          >
            Customer Store Door &rarr;
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
