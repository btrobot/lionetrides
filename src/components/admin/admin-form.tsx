'use client';

import React, { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============ 类型定义 ============

export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'password' | 'tel' | 'url';

export interface FieldConfig {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  min?: number;
  max?: number;
  maxLength?: number;
  helpText?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export interface FormValues {
  [key: string]: string | number | undefined;
}

export interface FormErrors {
  [key: string]: string;
}

export interface AdminFormProps {
  /** 表单字段配置 */
  fields: FieldConfig[];
  /** 表单值 */
  values: FormValues;
  /** 值变化回调 */
  onChange: (name: string, value: string | number) => void;
  /** 提交回调 */
  onSubmit: () => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 是否正在提交 */
  loading?: boolean;
  /** 提交按钮文字 */
  submitText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 表单错误信息 */
  errors?: FormErrors;
  /** 自定义类名 */
  className?: string;
  /** 是否只读 */
  readOnly?: boolean;
}

// ============ 验证函数 ============

export function validateField(name: string, value: string | number, config: FieldConfig): string {
  // 必填验证
  if (config.required && (value === '' || value === undefined || value === null)) {
    return `${config.label}不能为空`;
  }

  // 最小长度
  if (config.min !== undefined && typeof value === 'string' && value.length < config.min) {
    return `${config.label}至少${config.min}个字符`;
  }

  // 最大长度
  if (config.maxLength !== undefined && typeof value === 'string' && value.length > config.maxLength) {
    return `${config.label}不能超过${config.maxLength}个字符`;
  }

  // 数字范围
  if (config.type === 'number' && typeof value === 'number') {
    if (config.min !== undefined && value < config.min) {
      return `${config.label}不能小于${config.min}`;
    }
    if (config.max !== undefined && value > config.max) {
      return `${config.label}不能大于${config.max}`;
    }
  }

  // 邮箱格式
  if (config.type === 'email' && typeof value === 'string' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return '请输入有效的邮箱地址';
    }
  }

  // URL 格式
  if (config.type === 'url' && typeof value === 'string' && value) {
    try {
      new URL(value);
    } catch {
      return '请输入有效的 URL 地址';
    }
  }

  return '';
}

export function validateForm(values: FormValues, fields: FieldConfig[]): FormErrors {
  const errors: FormErrors = {};
  fields.forEach((field) => {
    const value = values[field.name];
    const error = validateField(field.name, value || '', field);
    if (error) {
      errors[field.name] = error;
    }
  });
  return errors;
}

// ============ AdminForm 组件 ============

export function AdminForm({
  fields,
  values,
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  submitText = '保存',
  cancelText = '取消',
  showCancel = true,
  errors = {},
  className,
  readOnly = false,
}: AdminFormProps) {
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // 客户端验证
      const formErrors = validateForm(values, fields);
      if (Object.keys(formErrors).length > 0) {
        // 如果有错误，不提交
        return;
      }
      onSubmit();
    },
    [values, fields, onSubmit]
  );

  const renderField = (field: FieldConfig) => {
    const value = values[field.name] ?? '';
    const error = errors[field.name];
    const disabled = readOnly || field.disabled || loading;

    const inputClass = cn(
      'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
      error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200',
      disabled && 'bg-slate-50 cursor-not-allowed opacity-60',
      field.className
    );

    return (
      <div key={field.name} className="space-y-2">
        <Label className="text-xs font-medium text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {field.type === 'textarea' ? (
          <Textarea
            value={value as string}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            disabled={disabled}
            maxLength={field.maxLength}
            className={inputClass}
          />
        ) : (
          <div className="relative">
            {field.prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                {field.prefix}
              </span>
            )}
            <Input
              type={field.type || 'text'}
              value={value as string}
              onChange={(e) => {
                const val = field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                onChange(field.name, val);
              }}
              placeholder={field.placeholder}
              disabled={disabled}
              min={field.min}
              max={field.max}
              maxLength={field.maxLength}
              className={cn(field.prefix && 'pl-8', field.suffix && 'pr-12', inputClass)}
            />
            {field.suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                {field.suffix}
              </span>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
        {field.helpText && !error && <p className="text-xs text-slate-400">{field.helpText}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {fields.map(renderField)}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        {showCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
        )}
        <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600">
          {loading && <span className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {submitText}
        </Button>
      </div>
    </form>
  );
}

// ============ AdminFormItem 单独使用 ============

export function AdminFormItem({
  field,
  value,
  onChange,
  error,
  readOnly = false,
  loading = false,
}: {
  field: FieldConfig;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  readOnly?: boolean;
  loading?: boolean;
}) {
  const disabled = readOnly || field.disabled || loading;
  const inputClass = cn(
    'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
    error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200',
    disabled && 'bg-slate-50 cursor-not-allowed opacity-60',
    field.className
  );

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {field.type === 'textarea' ? (
        <Textarea
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 3}
          disabled={disabled}
          maxLength={field.maxLength}
          className={inputClass}
        />
      ) : (
        <div className="relative">
          {field.prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              {field.prefix}
            </span>
          )}
          <Input
            type={field.type || 'text'}
            value={value as string}
            onChange={(e) => {
              const val = field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
              onChange(val);
            }}
            placeholder={field.placeholder}
            disabled={disabled}
            min={field.min}
            max={field.max}
            maxLength={field.maxLength}
            className={cn(field.prefix && 'pl-8', field.suffix && 'pr-12', inputClass)}
          />
          {field.suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              {field.suffix}
            </span>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      {field.helpText && !error && <p className="text-xs text-slate-400">{field.helpText}</p>}
    </div>
  );
}
