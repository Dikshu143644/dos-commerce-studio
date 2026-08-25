import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetPassword, loading: isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setError(null);
    try {
      await resetPassword(data.email);
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FDFBF7] px-4 py-12">
      {/* Warm Ambient Warehouse Background Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/images/backgrounds/warehouse-sunset-drone.jpg"
          alt="StockFlow Logistics Facility"
          className="w-full h-full object-cover filter brightness-[0.95] contrast-[1.02]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=85';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-amber-950/20 to-black/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md rounded-[32px] bg-white/95 backdrop-blur-2xl p-8 sm:p-10 border border-white/60 shadow-[0_25px_80px_rgba(0,0,0,0.25)] text-slate-900"
      >
        {!isSubmitted ? (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 shadow-xs">
                <Mail className="h-7 w-7 text-orange-500" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Forgot password?</h1>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Enter your verified work email for secure password recovery.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@stockflow.com"
                  className="h-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:border-orange-500"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-rose-500">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md shadow-orange-500/20"
              >
                {isLoading ? 'Sending Instructions...' : 'Send Reset Link'}
              </Button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
            <p className="text-xs text-slate-500">
              We&apos;ve sent password recovery instructions to{' '}
              <span className="font-bold text-slate-900">{getValues('email')}</span>
            </p>
            <Button
              variant="outline"
              onClick={() => setIsSubmitted(false)}
              className="w-full h-11 rounded-xl border-slate-200 text-slate-700"
            >
              Try another email
            </Button>
          </motion.div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
