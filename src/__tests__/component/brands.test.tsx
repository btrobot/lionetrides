import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import BrandsPage from '@/app/[locale]/brands/page';

describe('Public - Brands Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows spinner while loading', () => {
    global.fetch = vi.fn(() => new Promise(() => {}));
    render(<BrandsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders brands when API returns data as array directly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: [
          { id: 1, name: 'Brand A', slug: 'brand-a', website: 'https://a.com' },
          { id: 2, name: 'Brand B', slug: 'brand-b', website: 'https://b.com' },
        ],
      }),
    });
    render(<BrandsPage />);
    await waitFor(() => {
      expect(screen.getByText('Brand A')).toBeInTheDocument();
      expect(screen.getByText('Brand B')).toBeInTheDocument();
    });
  });

  it('shows empty state when API returns empty array', async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ success: true, data: [] }) });
    render(<BrandsPage />);
    await waitFor(() => {
      expect(screen.getByText('no_results')).toBeInTheDocument();
    });
  });
});
