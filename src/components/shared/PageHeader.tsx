import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  bannerImage?: string;
}

export function PageHeader({ title, description, actions, bannerImage }: PageHeaderProps) {
  if (bannerImage) {
    return (
      <div className="relative overflow-hidden rounded-[20px] border border-border bg-card p-6 md:p-8 shadow-lg group mb-6">
        {/* Photographic Hero Cover */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={bannerImage}
            alt=""
            className="w-full h-full object-cover opacity-25 filter saturate-125 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        </div>

        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-sm">{title}</h1>
            {description && <p className="text-sm md:text-base text-emerald-400/90 font-medium mt-1 drop-shadow-sm">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 mt-4 sm:mt-0">{actions}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 mt-3 sm:mt-0">{actions}</div>}
    </div>
  );
}
