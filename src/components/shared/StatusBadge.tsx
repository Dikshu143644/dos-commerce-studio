import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';

const statusColorMap: Record<string, BadgeProps['variant']> = {
  active: 'default',
  completed: 'default',
  delivered: 'default',
  approved: 'default',
  won: 'default',
  closed_won: 'default',
  received: 'default',
  new: 'info',
  pending: 'warning',
  processing: 'warning',
  submitted: 'warning',
  negotiation: 'warning',
  proposal: 'warning',
  draft: 'secondary',
  inactive: 'secondary',
  cancelled: 'destructive',
  returned: 'destructive',
  lost: 'destructive',
  closed_lost: 'destructive',
  overdue: 'destructive',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusColorMap[status.toLowerCase()] || 'outline';
  const displayText = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <Badge variant={variant} className={className}>
      {displayText}
    </Badge>
  );
}
