'use client';

import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// ============ 类型定义 ============

export interface AdminDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 内容 */
  children: React.ReactNode;
  /** 最大宽度 */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 是否点击遮罩关闭 */
  closeOnOverlay?: boolean;
  /** 是否 ESC 关闭 */
  closeOnEscape?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 顶部渐变条颜色 */
  gradientFrom?: string;
  /** 顶部渐变条颜色 */
  gradientTo?: string;
}

// ============ AdminDialog 组件 ============

export function AdminDialog({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  showClose = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  className,
  gradientFrom = 'from-blue-500',
  gradientTo = 'to-blue-600',
}: AdminDialogProps) {
  // ESC 关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity',
          'animate-in fade-in duration-200'
        )}
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* 对话框 */}
      <div
        className={cn(
          'relative w-full rounded-xl bg-white shadow-2xl',
          'animate-in zoom-in-95 fade-in duration-200',
          maxWidthClasses[maxWidth],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* 顶部渐变条 */}
        <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r rounded-t-xl', gradientFrom, gradientTo)} />

        {/* 关闭按钮 */}
        {showClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {/* 头部 */}
        <div className="pt-6 px-6 pb-4 border-b border-slate-100">
          <h2 id="dialog-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>

        {/* 内容 */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// ============ AdminAlertDialog 组件 ============

export interface AdminAlertDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: 'default' | 'danger';
}

export function AdminAlertDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  loading = false,
  variant = 'default',
}: AdminAlertDialogProps) {
  const gradientFrom = variant === 'danger' ? 'from-red-500' : 'from-blue-500';
  const gradientTo = variant === 'danger' ? 'to-red-600' : 'to-blue-600';
  const confirmColor = variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-500 hover:bg-blue-600';

  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth="sm"
      gradientFrom={gradientFrom}
      gradientTo={gradientTo}
      className="overflow-hidden"
    >
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50',
            confirmColor
          )}
        >
          {loading && <span className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent inline-block" />}
          {confirmText}
        </button>
      </div>
    </AdminDialog>
  );
}
