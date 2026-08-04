'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ─── Admin Table ───────────────────────────────────────
export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyText?: string;
}

export function AdminTable<T>({
  columns,
  data,
  keyField,
  onRowClick,
  loading,
  emptyText = '暂无数据',
}: AdminTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
        <p className="text-sm text-slate-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item, _idx) => (
              <tr
                key={String((item as Record<string, unknown>)[keyField])}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'transition-colors duration-150',
                  onRowClick && 'cursor-pointer',
                  'hover:bg-blue-50/40',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-sm text-slate-700',
                      col.className,
                    )}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────
export function AdminBadge({
  status,
  label,
  variant = 'default',
}: {
  status: string;
  label?: string;
  variant?: 'default' | 'pill';
}) {
  const colorMap: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    replied: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-50 text-slate-600 border-slate-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-50 text-slate-500 border-slate-200',
    draft: 'bg-slate-50 text-slate-500 border-slate-200',
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    archived: 'bg-slate-50 text-slate-500 border-slate-200',
    super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
    admin: 'bg-blue-50 text-blue-700 border-blue-200',
    editor: 'bg-green-50 text-green-700 border-green-200',
    viewer: 'bg-slate-50 text-slate-600 border-slate-200',
    customer: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  const displayLabel = label || status;
  const colors = colorMap[status] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        variant === 'pill'
          ? 'px-2.5 py-0.5 rounded-full text-xs border'
          : 'px-2 py-0.5 rounded-md text-xs border',
        colors,
      )}
    >
      {displayLabel}
    </span>
  );
}

// ─── Search Bar ────────────────────────────────────────
interface AdminSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AdminSearchBar({ value, onChange, placeholder = '搜索...', className }: AdminSearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
      />
    </div>
  );
}

// ─── Filter Tabs ───────────────────────────────────────
interface FilterTab {
  value: string;
  label: string;
  count?: number;
}

interface AdminFilterTabsProps {
  tabs: FilterTab[];
  active: string;
  onChange: (value: string) => void;
}

export function AdminFilterTabs({ tabs, active, onChange }: AdminFilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150',
            active === tab.value
              ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 opacity-70">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────
interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

export function AdminPagination({ page, totalPages, total, onChange }: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-slate-500">
        共 <span className="font-medium text-slate-700">{total}</span> 条，第 {page}/{totalPages} 页
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          上一页
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4));
          const p = start + i;
          if (p > totalPages) return null;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                'w-8 h-8 text-xs font-medium rounded-lg transition-all',
                p === page
                  ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          下一页
        </button>
      </div>
    </div>
  );
}