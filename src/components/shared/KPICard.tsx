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
    <Card className={cn('relative overflow-hidden group bg-white border border-slate-200/90 shadow-xs hover:border-orange-400/80 hover:shadow-md transition-all rounded-[22px]', className)}>
      {/* Ambient Subtle Background Overlay */}
      {bgImage && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={bgImage}
            alt=""
            className="w-full h-full object-cover opacity-25 filter saturate-150 group-hover:scale-110 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/40" />
        </div>
      )}

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 pt-0.5">
                {trend.isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                )}
                <span
                  className={cn(
                    'text-xs font-bold',
                    trend.isPositive ? 'text-emerald-600' : 'text-rose-500'
                  )}
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
                {description && (
                  <span className="text-xs text-slate-400 ml-1">{description}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-orange-50 border border-orange-200/80 group-hover:border-orange-400 shadow-xs transition-colors">
            <Icon className="h-5 w-5 text-orange-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
