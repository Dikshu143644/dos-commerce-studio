import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { Eye, EyeOff, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountryCodePicker } from '@/components/auth/CountryCodePicker';
import { useAuth } from '@/hooks/useAuth';

const step1Schema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const step2Schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const { signup, loading: isLoading } = useAuth();
  const navigate = useNavigate();

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
  });

  const handleStep1 = (_data: Step1Data) => {
    setStep(2);
  };

  const handleStep2 = useCallback(
    async (data: Step2Data) => {
      try {
        const credentials = step1Form.getValues();
        // Build E.164 phone number
        const phoneNumber = `${countryCode}${data.phone.replace(/\D/g, '')}`;

        // Auto-assign viewer role - no user choice
        await signup(credentials.email, credentials.password, {
          full_name: data.fullName,
          phone: phoneNumber,
          role: 'viewer',
        });

        // Account created successfully — go to dashboard
        // OTP verification skipped until SMS provider (Twilio/MSG91) is configured
        navigate('/');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create account.';
        // Check for rate limit
        if (message.toLowerCase().includes('after') && message.toLowerCase().includes('seconds')) {
          toast.error(message);
        } else {
          toast.error(message);
        }
      }
    },
    [step1Form, countryCode, signup]
  );

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
        {/* Progress indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              step >= 1 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {step > 1 ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <div className={`h-0.5 w-8 ${step > 1 ? 'bg-orange-500' : 'bg-slate-200'}`} />
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              step >= 2 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
            }`}
          >
            2
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-[10px] bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-xs">
              S
            </div>
            <span className="text-xl font-black text-slate-900">StockFlow</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {step === 1 && 'Step 1: Set up your enterprise credentials'}
            {step === 2 && 'Step 2: Tell us about yourself'}
          </p>
        </div>

        {/* Step 1: Credentials */}
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={step1Form.handleSubmit(handleStep1)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                className="h-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                {...step1Form.register('email')}
              />
              {step1Form.formState.errors.email && (
                <p className="text-xs text-rose-500">
                  {step1Form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  className="h-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl pr-10"
                  {...step1Form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {step1Form.formState.errors.password && (
                <p className="text-xs text-rose-500">
                  {step1Form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                className="h-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                {...step1Form.register('confirmPassword')}
              />
              {step1Form.formState.errors.confirmPassword && (
                <p className="text-xs text-rose-500">
                  {step1Form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md shadow-orange-500/20"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.form>
        )}

        {/* Step 2: Personal info */}
        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={step2Form.handleSubmit(handleStep2)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-bold text-slate-700">Full name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Sarah Chen"
                className="h-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                {...step2Form.register('fullName')}
              />
              {step2Form.formState.errors.fullName && (
                <p className="text-xs text-rose-500">
                  {step2Form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold text-slate-700">Phone number</Label>
              <div className="flex gap-2">
                <CountryCodePicker value={countryCode} onChange={setCountryCode} />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="98765 43210"
                  className="h-11 flex-1 bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                  {...step2Form.register('phone')}
                />
              </div>
              {step2Form.formState.errors.phone && (
                <p className="text-xs text-rose-500">
                  {step2Form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-11 rounded-xl border-slate-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md shadow-orange-500/20"
              >
                {isLoading ? 'Creating...' : 'Complete'}
              </Button>
            </div>
          </motion.form>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-600 hover:text-orange-700 font-bold">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
