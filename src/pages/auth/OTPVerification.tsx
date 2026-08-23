import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Phone, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OTPInput } from '@/components/auth/OTPInput';
import { supabase } from '@/lib/supabase';

interface OTPVerificationProps {
  phone: string;
  onVerified: () => void;
  onSkip: () => void;
}

export default function OTPVerification({ phone, onVerified, onSkip }: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [providerUnavailable, setProviderUnavailable] = useState(false);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendOtp = useCallback(async () => {
    setIsSending(true);
    setError(null);
    try {
      // Use updateUser to attach the phone to the existing session
      // instead of signInWithOtp which would create a competing session
      const { error: updateError } = await supabase.auth.updateUser({ phone });
      if (updateError) {
        // If provider not configured or phone auth not enabled, gracefully handle
        if (
          updateError.message.toLowerCase().includes('not enabled') ||
          updateError.message.toLowerCase().includes('provider') ||
          updateError.message.toLowerCase().includes('sms') ||
          updateError.message.toLowerCase().includes('phone')
        ) {
          setProviderUnavailable(true);
          return;
        }
        throw updateError;
      }
      setOtpSent(true);
      setResendCooldown(60);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code';
      // Check if it is a provider config issue
      if (message.toLowerCase().includes('not enabled') || message.toLowerCase().includes('provider')) {
        setProviderUnavailable(true);
      } else {
        setError(message);
      }
    } finally {
      setIsSending(false);
    }
  }, [phone]);

  // Send OTP on mount
  useEffect(() => {
    sendOtp();
  }, [sendOtp]);

  const verifyOtp = useCallback(async () => {
    if (otp.length !== 6) return;
    setIsVerifying(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'phone_change',
      });
      if (verifyError) throw verifyError;
      setSuccess(true);
      setTimeout(() => onVerified(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [otp, phone, onVerified]);

  // If SMS provider not available, show pending badge
  if (providerUnavailable) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/30">
          <AlertCircle className="h-8 w-8 text-yellow-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Phone Verification Pending</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            SMS verification is not currently available. Your phone number has been saved and can be verified later.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-xs text-yellow-500">
          <AlertCircle className="h-3 w-3" />
          Phone verification pending
        </div>
        <Button onClick={onSkip} className="w-full">
          Continue to Dashboard
        </Button>
      </motion.div>
    );
  }

  // Success state
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Phone Verified!</h3>
          <p className="mt-1 text-sm text-muted-foreground">Redirecting you to the dashboard...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
          <Phone className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Verify your phone</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {otpSent
            ? `We sent a 6-digit code to ${phone}`
            : `Sending verification code to ${phone}...`}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      {/* OTP Input */}
      <OTPInput value={otp} onChange={setOtp} disabled={isVerifying} />

      {/* Verify button */}
      <Button
        onClick={verifyOtp}
        className="w-full"
        disabled={otp.length !== 6 || isVerifying}
      >
        {isVerifying ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Verifying...
          </span>
        ) : (
          'Verify Phone Number'
        )}
      </Button>

      {/* Resend */}
      <div className="text-center">
        <button
          type="button"
          onClick={sendOtp}
          disabled={resendCooldown > 0 || isSending}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCw className="h-3.5 w-3.5" />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </div>

      {/* Skip option */}
      <button
        type="button"
        onClick={onSkip}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip for now
      </button>
    </motion.div>
  );
}
