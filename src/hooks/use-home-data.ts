'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSiteConfig } from '@/providers/site-config-provider';

// ─── Types ───────────────────────────────────────────────

export interface HomeCategory {
  id: number;
  name: string;
  slug: string;
  product_count: number;
  icon?: string;
  gradient?: string;
}

export interface HomeProduct {
  id: number;
  name: string;
  category: string;
  image: string | null;
  specs: string | null;
  rating: number | null;
}

export interface HomeCertification {
  id: number;
  name: string;
  slug: string;
}

export interface HomePartner {
  id: number;
  name: string;
  logo_url: string | null;
}

export interface HomeNewsItem {
  id: number;
  title: string;
  date: string;
  category: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  desc: string;
}

export interface HomeStat {
  label: string;
  value: number;
  suffix: string;
}

export interface FactoryFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface HomeData {
  categories: HomeCategory[];
  products: HomeProduct[];
  certifications: HomeCertification[];
  partners: HomePartner[];
  news: HomeNewsItem[];
  processSteps: ProcessStep[];
  stats: HomeStat[];
  factoryFeatures: FactoryFeature[];
  loading: boolean;
  error: string | null;
}

const defaultData: HomeData = {
  categories: [],
  products: [],
  certifications: [],
  partners: [],
  news: [],
  processSteps: [],
  stats: [],
  factoryFeatures: [],
  loading: true,
  error: null,
};

// ─── Gradient & Icon Maps ────────────────────────────────

const CATEGORY_GRADIENTS: Record<string, string> = {
  'roller-coasters': 'from-blue-500 to-cyan-500',
  'ferris-wheels': 'from-purple-500 to-pink-500',
  'carousels': 'from-rose-500 to-orange-500',
  'bumper-cars': 'from-amber-500 to-red-500',
  'water-rides': 'from-teal-500 to-emerald-500',
  "kids-rides": 'from-green-500 to-lime-500',
};

const CATEGORY_ICONS: Record<string, string> = {
  'roller-coasters': '🎢',
  'ferris-wheels': '🎡',
  'carousels': '🎠',
  'bumper-cars': '🏎️',
  'water-rides': '🌊',
  "kids-rides": '🎪',
};

export function getCategoryGradient(slug: string): string {
  return CATEGORY_GRADIENTS[slug] || 'from-blue-500 to-cyan-500';
}

export function getCategoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] || '🎪';
}

// ─── Hook ─────────────────────────────────────────────────

export function useHomeData(): HomeData {
  const config = useSiteConfig();
  const [data, setData] = useState<HomeData>(defaultData);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, prodRes, certRes, partRes, newsRes] = await Promise.all([
        fetch('/api/v1/categories'),
        fetch('/api/v1/products?limit=8'),
        fetch('/api/v1/certifications'),
        fetch('/api/v1/partners'),
        fetch('/api/v1/news?limit=3'),
      ]);

      const [catData, prodData, certData, partData, newsData] = await Promise.all([
        catRes.json(),
        prodRes.json(),
        certRes.json(),
        partRes.json(),
        newsRes.json(),
      ]);

      // Parse JSON config from site settings
      let processSteps: ProcessStep[] = [];
      let stats: HomeStat[] = [];
      let factoryFeatures: FactoryFeature[] = [];

      try {
        processSteps = JSON.parse(config.home_process_steps || '[]');
      } catch { /* ignore */ }
      try {
        stats = JSON.parse(config.home_stats || '[]');
      } catch { /* ignore */ }
      try {
        factoryFeatures = JSON.parse(config.home_factory_features || '[]');
      } catch { /* ignore */ }

      setData({
        categories: (catData?.data?.items ?? []) as HomeCategory[],
        products: (prodData?.items ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as number,
          name: p.name as string,
          category: '',
          image: p.main_image as string | null,
          specs: (p.specifications as string) || null,
          rating: 5,
        })),
        certifications: (certData?.data ?? []) as HomeCertification[],
        partners: (partData?.data ?? []) as HomePartner[],
        news: (newsData?.data?.items ?? []).map((n: Record<string, unknown>) => ({
          id: n.id as number,
          title: n.title as string,
          date: (n.published_at as string) || (n.created_at as string) || '',
          category: (n.category as string) || '',
        })),
        processSteps,
        stats,
        factoryFeatures,
        loading: false,
        error: null,
      });
    } catch (err) {
      setData((prev) => ({ ...prev, loading: false, error: String(err) }));
    }
  }, [config.home_process_steps, config.home_stats, config.home_factory_features]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return data;
}