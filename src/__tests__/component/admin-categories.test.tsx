import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminCategories from '@/app/[locale]/admin/categories/page';

describe('Admin - Categories Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading text while fetching', () => {
    global.fetch = vi.fn(() => new Promise(() => {}));
    render(<AdminCategories />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders empty state when API returns data.items as empty array', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: { items: [] } }),
    });
    render(<AdminCategories />);
    await waitFor(() => {
      expect(screen.getByText('暂无分类。')).toBeInTheDocument();
    });
  });

  it('renders categories when API returns data.items', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          items: [
            { id: 1, name: 'Roller Coasters', slug: 'roller-coasters', description: 'Exciting rides' },
            { id: 2, name: 'Water Rides', slug: 'water-rides', description: 'Splash fun' },
          ],
        },
      }),
    });
    render(<AdminCategories />);
    await waitFor(() => {
      expect(screen.getByText('Roller Coasters')).toBeInTheDocument();
      expect(screen.getByText('Water Rides')).toBeInTheDocument();
    });
  });

  it('shows no_results when API returns data as array (wrong shape)', async () => {
    // 模拟旧 bug：data 直接是数组而非 { items: [...] }
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: [
          { id: 1, name: 'Roller Coasters', slug: 'roller-coasters', description: 'Exciting rides' },
        ],
      }),
    });
    render(<AdminCategories />);
    await waitFor(() => {
      expect(screen.getByText('暂无分类。')).toBeInTheDocument();
    });
  });
});
