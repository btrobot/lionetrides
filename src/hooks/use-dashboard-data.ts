'use client';

import { useEffect, useRef, useState } from 'react';

interface DashboardStats {
  overview: {
    products: number;
    inquiries: number;
    users: number;
    categories: number;
    reviews: number;
    news: number;
  };
  productStatusDistribution: { status: string; count: number }[];
  inquiryStatusDistribution: { status: string; count: number }[];
  monthlyInquiries: { month: string; count: number }[];
  categoryDistribution: { name: string; count: number }[];
  monthlyUsers: { month: string; count: number }[];
  userRoleDistribution: { role: string; count: number }[];
  topProducts: { id: number; name: string; count: number }[];
  recentActivity: {
    id: number;
    inquiryNo: string;
    contactName: string;
    companyName: string | null;
    status: string;
    createdAt: string;
  }[];
}

export function useDashboardData(authFetch: (url: string) => Promise<Response | null>) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchData = async () => {
      try {
        const res = await authFetch('/api/v1/admin/dashboard');
        if (!res) throw new Error('Failed to fetch dashboard data');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Unknown error');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authFetch]);

  return { data, loading, error };
}