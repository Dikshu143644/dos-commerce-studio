import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, Briefcase, Package, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoginForm } from '@/hooks/useLoginForm';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function StaffLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, rateLimitCountdown, buttonDisabled, onSubmit } = useLoginForm();
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
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'staff@stockflow.com',
      password: 'password123',
    },
  });

  const handleQuickDemo = (role: UserRole) => {
    loginDemo(role);
    toast.success(`Logged in as Staff (${role.toUpperCase()})`);
    navigate(from, { replace: true });
  };

  const setFillCredentials = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 py-8">
      {/* Background gradient orbs */}
      <div className="gradient-orb absolute -top-40 -right-40 h-[500px] w-[500px] opacity-20" />
      <div className="gradient-orb absolute -bottom-40 -left-40 h-[400px] w-[400px] opacity-15" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass w-full max-w-lg rounded-[24px] p-6 sm:p-8"
      >
        {/* Staff portal branding */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-6 text-center"
        >
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[16px] bg-primary/20 border border-primary/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Staff & Operations Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            StockFlow internal operations & management access
          </p>
        </motion.div>

        {/* 1-Click Fast Roles */}
        <div className="mb-6 rounded-[16px] border border-primary/20 bg-primary/5 p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">1-CLICK STAFF ACCESS</span>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
              Instant
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="flex flex-col items-center justify-center rounded-[10px] border border-primary/30 bg-primary/10 hover:bg-primary/20 py-2.5 px-2 text-center transition-all cursor-pointer hover:scale-102"
            >
              <Shield className="h-4 w-4 text-emerald-400 mb-1" />
              <span className="text-xs font-semibold text-foreground">Admin</span>
              <span className="text-[10px] text-muted-foreground">Master</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('manager')}
              className="flex flex-col items-center justify-center rounded-[10px] border border-border bg-secondary/40 hover:bg-secondary py-2.5 px-2 text-center transition-all cursor-pointer hover:scale-102"
            >
              <Briefcase className="h-4 w-4 text-teal-400 mb-1" />
              <span className="text-xs font-semibold text-foreground">Manager</span>
              <span className="text-[10px] text-muted-foreground">CRM & Stock</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('staff')}
              className="flex flex-col items-center justify-center rounded-[10px] border border-border bg-secondary/40 hover:bg-secondary py-2.5 px-2 text-center transition-all cursor-pointer hover:scale-102"
            >
              <Package className="h-4 w-4 text-cyan-400 mb-1" />
              <span className="text-xs font-semibold text-foreground">Staff</span>
              <span className="text-[10px] text-muted-foreground">Inventory</span>
            </button>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="staff-email">Staff Email</Label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setFillCredentials('staff@stockflow.com', 'password123')}
                  className="text-[11px] text-primary/80 hover:text-primary underline cursor-pointer"
                >
                  Fill Staff
                </button>
                <span className="text-muted-foreground text-[11px]">&middot;</span>
                <button
                  type="button"
                  onClick={() => setFillCredentials('manager@stockflow.com', 'password123')}
                  className="text-[11px] text-primary/80 hover:text-primary underline cursor-pointer"
                >
                  Fill Manager
                </button>
              </div>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="staff-email"
                type="email"
                placeholder="you@stockflow.com"
                className="pl-10 bg-secondary/40"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="pl-10 pr-10 bg-secondary/40"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={buttonDisabled}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Signing in...
              </span>
            ) : rateLimitCountdown > 0 ? (
              `Wait ${rateLimitCountdown}s`
            ) : (
              'Sign in to Staff Portal'
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleQuickDemo('staff')}
            className="w-full border-primary/30 text-primary hover:bg-primary/10 gap-2"
          >
            <Zap className="h-4 w-4" /> Quick Staff Direct Access
          </Button>
        </form>

        {/* Back to customer login */}
        <p className="mt-5 text-center text-xs text-muted-foreground">
          <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
            &larr; Back to customer login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

