import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function OTPInput({ length = 6, value, onChange, disabled = false, className }: OTPInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputsRef.current[0] && !disabled) {
      inputsRef.current[0].focus();
    }
  }, [disabled]);

  const handleChange = useCallback(
    (index: number, char: string) => {
      // Only allow digits
      if (char && !/^\d$/.test(char)) return;

      const newValue = value.split('');
      newValue[index] = char;
      const result = newValue.join('').slice(0, length);
      onChange(result);

      // Auto-advance to next input
      if (char && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    },
    [value, onChange, length]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!value[index] && index > 0) {
          // Move to previous input if current is empty
          inputsRef.current[index - 1]?.focus();
          const newValue = value.split('');
          newValue[index - 1] = '';
          onChange(newValue.join(''));
        } else {
          const newValue = value.split('');
          newValue[index] = '';
          onChange(newValue.join(''));
        }
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputsRef.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    },
    [value, onChange, length]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (pasted) {
        onChange(pasted);
        // Focus the input after the last pasted character
        const focusIndex = Math.min(pasted.length, length - 1);
        inputsRef.current[focusIndex]?.focus();
      }
    },
    [onChange, length]
  );

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            'h-12 w-12 rounded-[12px] border border-input bg-background text-center text-lg font-semibold text-foreground transition-all',
            'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'placeholder:text-muted-foreground',
            value[index] && 'border-primary/50'
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
