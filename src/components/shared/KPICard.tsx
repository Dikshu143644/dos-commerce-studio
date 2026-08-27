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
  iconColor?: 'purple' | 'orange' | 'emerald' | 'blue';
  bgImage?: string;
}

export function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  description,
  className,
  iconColor = 'purple',
  bgImage,
}: KPICardProps) {
  const colorMap = {
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200/80 group-hover:border-purple-400',
      glow: 'group-hover:shadow-purple-600/10',
    },
    orange: {
      iconBg: 'bg-orange-50 text-orange-600 border-orange-200/80 group-hover:border-orange-400',
      glow: 'group-hover:shadow-orange-600/10',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80 group-hover:border-emerald-400',
      glow: 'group-hover:shadow-emerald-600/10',
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200/80 group-hover:border-blue-400',
      glow: 'group-hover:shadow-blue-600/10',
    },
  };

  const scheme = colorMap[iconColor] || colorMap.purple;

  return (
    <Card
      className={cn(
        'relative overflow-hidden group bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl',
        scheme.glow,
        className
      )}
    >
      {bgImage && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={bgImage}
            alt=""
            className="w-full h-full object-cover opacity-15 filter saturate-150 group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
        </div>
      )}

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black border',
                    trend.isPositive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  )}
                >
                  {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
                {description && <span className="text-xs text-slate-400 font-medium">{description}</span>}
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl border shadow-xs transition-all duration-300 group-hover:scale-110',
              scheme.iconBg
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
