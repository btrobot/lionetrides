import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAdminAuth } from '@/hooks/use-admin-auth';

// Override the setup file's next/navigation mock so we can verify replace() calls
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/zh/admin',
  useSearchParams: () => new URLSearchParams(),
}));

function mockLocalStorage(store: Record<string, string>) {
  const storage: Record<string, string> = { ...store };
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => storage[key] ?? null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => { storage[key] = value; });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => { delete storage[key]; });
}

describe('Reg: Admin Auth - useAdminAuth Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockReplace.mockClear();
  });

  it('redirects to login when no token in localStorage', async () => {
    mockLocalStorage({});
    renderHook(() => useAdminAuth());
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/zh/auth/login');
    });
  });

  it('redirects to login when token is invalid (API returns 401)', async () => {
    mockLocalStorage({ token: 'expired-token' });
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });

    renderHook(() => useAdminAuth());
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/zh/auth/login');
    });
  });

  it('redirects to login when token is invalid (API returns not ok)', async () => {
    mockLocalStorage({ token: 'bad-token' });
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });

    renderHook(() => useAdminAuth());
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/zh/auth/login');
    });
  });

  it('redirects to login when user role is not admin', async () => {
    mockLocalStorage({ token: 'valid-token' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 1, email: 'user@test.com', name: 'User', role: 'customer' } }),
    });

    renderHook(() => useAdminAuth());
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/zh/auth/login');
    });
  });

  it('sets user and checked=true when token is valid and role is admin', async () => {
    mockLocalStorage({ token: 'valid-token' });
    const adminUser = { id: 1, email: 'admin@test.com', name: 'Admin', role: 'admin' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: adminUser }),
    });

    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => {
      expect(result.current.checked).toBe(true);
    });
    expect(result.current.user).toEqual(adminUser);
    expect(result.current.token).toBe('valid-token');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('sets user and checked=true when role is super_admin', async () => {
    mockLocalStorage({ token: 'super-token' });
    const superAdmin = { id: 2, email: 'super@test.com', name: 'Super', role: 'super_admin' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: superAdmin }),
    });

    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => {
      expect(result.current.checked).toBe(true);
    });
    expect(result.current.user?.role).toBe('super_admin');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('authFetch adds Authorization header', async () => {
    mockLocalStorage({ token: 'my-token' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 1, role: 'admin' } }),
    });

    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => { expect(result.current.checked).toBe(true); });

    // Reset fetch mock to track authFetch calls
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    global.fetch = fetchMock;

    await act(async () => {
      await result.current.authFetch('/api/v1/test');
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/test', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
    }));
  });

  it('authFetch redirects to login on 401', async () => {
    mockLocalStorage({ token: 'expired' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 1, role: 'admin' } }),
    });

    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => { expect(result.current.checked).toBe(true); });

    mockReplace.mockClear();

    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });

    const res = await act(async () => {
      return result.current.authFetch('/api/v1/protected');
    });

    expect(res).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith('/zh/auth/login');
  });

  it('authHeaders returns Content-Type and Authorization', async () => {
    mockLocalStorage({ token: 'my-token' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 1, role: 'admin' } }),
    });

    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => { expect(result.current.checked).toBe(true); });

    const headers = result.current.authHeaders();
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBe('Bearer my-token');
  });

  it('authHeaders merges extra headers', async () => {
    mockLocalStorage({ token: 'my-token' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 1, role: 'admin' } }),
    });

    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => { expect(result.current.checked).toBe(true); });

    const headers = result.current.authHeaders({ 'X-Custom': 'value' });
    expect(headers['Authorization']).toBe('Bearer my-token');
    expect(headers['X-Custom']).toBe('value');
  });
});