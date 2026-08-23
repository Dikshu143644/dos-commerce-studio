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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-4">
      <div className="gradient-orb absolute -top-32 -right-32 h-96 w-96" />
      <div className="gradient-orb absolute -bottom-32 -left-32 h-80 w-80 opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass w-full max-w-md rounded-[24px] p-8"
      >
        {/* Progress indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            {step > 1 ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <div className={`h-0.5 w-8 ${step > 1 ? 'bg-primary' : 'bg-border'}`} />
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            2
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 1 && 'Set up your login credentials'}
            {step === 2 && 'Tell us about yourself'}
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
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                {...step1Form.register('email')}
              />
              {step1Form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {step1Form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  className="pr-10"
                  {...step1Form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {step1Form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {step1Form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                {...step1Form.register('confirmPassword')}
              />
              {step1Form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {step1Form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full">
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.form>
        )}

        {/* Step 2: Personal Info */}
        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={step2Form.handleSubmit(handleStep2)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                placeholder="Full Name"
                {...step2Form.register('fullName')}
              />
              {step2Form.formState.errors.fullName && (
                <p className="text-xs text-destructive">
                  {step2Form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <div className="flex">
                <CountryCodePicker value={countryCode} onChange={setCountryCode} />
                <Input
                  id="phone"
                  placeholder="10 digit number"
                  className="rounded-l-none"
                  {...step2Form.register('phone')}
                />
              </div>
              {step2Form.formState.errors.phone && (
                <p className="text-xs text-destructive">
                  {step2Form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  'Create account'
                )}
              </Button>
            </div>
          </motion.form>
        )}

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
