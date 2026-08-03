'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/routing';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export function useAdminAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] as Locale;
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  const redirectToLogin = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace(`/${locale}/auth/login`);
  }, [locale, router]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      redirectToLogin();
      return;
    }

    setToken(storedToken);

    // 验证 token 有效性
    fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Token invalid');
        return res.json();
      })
      .then((data) => {
        if (!data.success) throw new Error('Token invalid');
        const u = data.data;
        if (u.role !== 'admin' && u.role !== 'super_admin' && u.role !== 'editor' && u.role !== 'viewer') {
          redirectToLogin();
          return;
        }
        // 刷新 localStorage 中的用户信息
        localStorage.setItem('user', JSON.stringify(u));
        setUser(u);
        setChecked(true);
      })
      .catch(() => {
        redirectToLogin();
      });
  }, [locale, redirectToLogin]);

  const authHeaders = useCallback(
    (extra?: Record<string, string>): Record<string, string> => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    }),
    [token],
  );

  const authFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      if (!checked || !token) {
        return null;
      }

      try {
        const res = await fetch(url, {
          ...options,
          headers: {
            ...authHeaders(),
            ...(options?.headers as Record<string, string>),
          },
        });
        if (res.status === 401) {
          redirectToLogin();
          return null;
        }
        return res;
      } catch {
        return null;
      }
    },
    [authHeaders, checked, redirectToLogin, token],
  );

  return { token, user, checked, authHeaders, authFetch };
}
