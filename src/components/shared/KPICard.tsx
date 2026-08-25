import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
  bgImage?: string;
}

export function KPICard({ label, value, icon: Icon, trend, description, className, bgImage }: KPICardProps) {
  return (
    <Card className={cn('relative overflow-hidden group border border-border hover:border-emerald-500/40 transition-all', className)}>
      {/* Ambient Glassmorphic Background Overlay */}
      {bgImage && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={bgImage}
            alt=""
            className="w-full h-full object-cover opacity-15 filter saturate-150 group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/70" />
        </div>
      )}

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center gap-1">
                {trend.isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-primary' : 'text-destructive'
                  )}
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
                {description && (
                  <span className="text-xs text-muted-foreground ml-1">{description}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary/10 border border-primary/20 group-hover:border-primary/50 shadow-sm transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
