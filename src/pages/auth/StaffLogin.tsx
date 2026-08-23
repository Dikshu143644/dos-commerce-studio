import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function StaffLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const { login, loading: isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Countdown timer for rate limiting
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      if (isSubmitDisabled || rateLimitCountdown > 0) return;

      // Debounce: disable for 3 seconds
      setIsSubmitDisabled(true);
      setTimeout(() => setIsSubmitDisabled(false), 3000);

      try {
        await login(data.email, data.password);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sign in.';
        if (message.toLowerCase().includes('after') && message.toLowerCase().includes('seconds')) {
          const match = message.match(/(\d+)\s*second/i);
          const seconds = match ? parseInt(match[1], 10) : 60;
          setRateLimitCountdown(seconds);
          toast.error(`Rate limited. Please wait ${seconds} seconds before trying again.`);
        } else {
          toast.error(message);
        }
      }
    },
    [login, isSubmitDisabled, rateLimitCountdown]
  );

  const buttonDisabled = isLoading || isSubmitDisabled || rateLimitCountdown > 0;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-4">
      {/* Background gradient orbs */}
      <div className="gradient-orb absolute -top-40 -right-40 h-[500px] w-[500px] opacity-15" />
      <div className="gradient-orb absolute -bottom-40 -left-40 h-[400px] w-[400px] opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass w-full max-w-md rounded-[24px] p-8"
      >
        {/* Staff portal branding */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-primary/20 border border-primary/30">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Staff Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            StockFlow internal access
          </p>
        </motion.div>

        {/* Login form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="staff-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="staff-email"
                type="email"
                placeholder="you@stockflow.com"
                className="pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="pl-10 pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={buttonDisabled}>
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
        </form>

        {/* Back to customer login */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
            &larr; Back to customer login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
