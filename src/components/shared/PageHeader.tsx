import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: ReactNode;
  bannerImage?: string;
}

export function PageHeader({ title, description, badge, actions, bannerImage }: PageHeaderProps) {
  if (bannerImage) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm group mb-6">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={bannerImage}
            alt=""
            className="w-full h-full object-cover opacity-20 filter saturate-150 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {badge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />
                {badge}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            {description && <p className="text-sm text-slate-500 font-medium mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-3 mt-4 sm:mt-0">{actions}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
      <div>
        {badge && (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 mb-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />
            {badge}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 font-medium mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 mt-3 sm:mt-0">{actions}</div>}
    </div>
  );
}
