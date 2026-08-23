import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface UseLoginFormReturn {
  isLoading: boolean;
  isSubmitDisabled: boolean;
  rateLimitCountdown: number;
  buttonDisabled: boolean;
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
}

export function useLoginForm(): UseLoginFormReturn {
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const { login, loading: isLoading } = useAuth();

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
    async (data: { email: string; password: string }) => {
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

  return {
    isLoading,
    isSubmitDisabled,
    rateLimitCountdown,
    buttonDisabled,
    onSubmit,
  };
}
