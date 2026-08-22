import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface SearchInputProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  className?: string;
  delay?: number;
}

export function SearchInput({
  placeholder = 'Search...',
  onSearch,
  className,
  delay = 300,
}: SearchInputProps) {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    onSearch?.(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="pl-9"
      />
    </div>
  );
}
