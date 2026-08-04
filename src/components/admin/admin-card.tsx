'use client';

import { cn } from '@/lib/utils';

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function AdminCard({ children, className, padding = true }: AdminCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-100 shadow-sm transition-shadow duration-200 hover:shadow-md',
        padding && 'p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: 'blue' | 'purple' | 'cyan' | 'orange' | 'emerald' | 'rose';
  trend?: { value: string; positive: boolean };
  subtitle?: string;
}

const gradientMap: Record<string, string> = {
  blue: 'from-blue-500 to-blue-700',
  purple: 'from-purple-500 to-purple-700',
  cyan: 'from-cyan-500 to-cyan-700',
  orange: 'from-orange-500 to-orange-700',
  emerald: 'from-emerald-500 to-emerald-700',
  rose: 'from-rose-500 to-rose-700',
};

export function AdminStatCard({ title, value, icon, gradient, trend, subtitle }: AdminStatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-br ${gradientMap[gradient]} p-6 text-white shadow-lg`}>
      <div className="absolute right-3 top-3 opacity-20">
        <div className="h-16 w-16">{icon}</div>
      </div>
      <div className="relative z-10">
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-green-200' : 'text-red-200'}`}>
              <span>{trend.positive ? '↑' : '↓'}</span>
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-xs text-white/70">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function AdminPageHeader({ title, description, actions, children }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-[22px] font-semibold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {(actions || children) && <div className="flex items-center gap-3">{children || actions}</div>}
    </div>
  );
}

interface AdminEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminEmptyState({ icon, title, description, action }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-slate-300">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function AdminLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 flex-1 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}