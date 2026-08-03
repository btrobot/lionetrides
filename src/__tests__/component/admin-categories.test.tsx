import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockAuthFetch = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/use-admin-auth', () => ({
  useAdminAuth: () => ({
    authFetch: mockAuthFetch,
    authHeaders: () => ({ Authorization: 'Bearer test-token' }),
    user: { id: 1, email: 'admin@test.com', name: 'Admin' },
    checked: true,
    loading: false,
  }),
}));

import AdminCategories from '@/app/[locale]/admin/categories/page';

function mockResponse(data: unknown) {
  return { json: () => Promise.resolve(data), ok: true, status: 200 };
}

const mockCategories = [
  { id: 1, name: 'Roller Coasters', slug: 'roller-coasters', description: 'High-speed thrill rides', sort_order: 1, status: 'active', created_at: '2024-01-01' },
  { id: 2, name: 'Water Rides', slug: 'water-rides', description: 'Splash into fun', sort_order: 2, status: 'active', created_at: '2024-01-02' },
];

describe('AdminCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton while fetching', async () => {
    mockAuthFetch.mockReturnValueOnce(new Promise(() => {}));
    const { container } = render(<AdminCategories />);
    // The new AdminLoadingSkeleton renders animated pulse divs
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders empty state when no categories', async () => {
    mockAuthFetch.mockResolvedValueOnce(mockResponse({ success: true, data: { items: [] } }));
    render(<AdminCategories />);
    await waitFor(() => {
      expect(screen.getByText('暂无分类')).toBeInTheDocument();
    });
  });

  it('renders categories when API returns data', async () => {
    mockAuthFetch.mockResolvedValueOnce(mockResponse({ success: true, data: { items: mockCategories } }));
    render(<AdminCategories />);
    await waitFor(() => {
      expect(screen.getByText('Roller Coasters')).toBeInTheDocument();
    });
    expect(screen.getByText('Water Rides')).toBeInTheDocument();
  });

  it('opens add dialog when clicking 新增分类', async () => {
    mockAuthFetch.mockResolvedValueOnce(mockResponse({ success: true, data: { items: [] } }));
    render(<AdminCategories />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /新增分类/ })).toBeInTheDocument();
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /新增分类/ }));
    // Dialog should be open - check for the dialog role
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
