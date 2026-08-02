'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Locale } from '@/i18n/routing';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split('/')[1] as Locale;

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', company: '', phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (serverError) setServerError('');
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name || formData.name.length < 2) e.name = 'Name is required';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email';
    if (!formData.password || formData.password.length < 6) e.password = 'At least 6 characters';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      const res = await fetch('/api/v1/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: formData.name,
          email: formData.email,
          password: formData.password,
          company: formData.company || undefined,
          phone: formData.phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setServerError(data.error || 'Registration failed');
        return;
      }
      localStorage.setItem('token', data.data.token);
      router.push(`/${currentLocale}/account/inquiries`);
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-lg border-0 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('register_title')}</h1>
          <p className="text-gray-500 mt-2">{t('register_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {serverError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">{serverError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="name" className="pl-10" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
              </div>
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="email" type="email" className="pl-10" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">{t('company')}</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="company" className="pl-10" value={formData.company} onChange={(e) => handleChange('company', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="phone" type="tel" className="pl-10" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input id="password" type="password" className="pl-10" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} required />
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirm_password')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input id="confirmPassword" type="password" className="pl-10" value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} required />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : <>{t('create_account')} <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('has_account')}{' '}
          <Link href={`/${currentLocale}/auth/login`} className="text-blue-600 hover:text-blue-700 font-medium">
            {t('sign_in')}
          </Link>
        </p>
      </Card>
    </div>
  );
}