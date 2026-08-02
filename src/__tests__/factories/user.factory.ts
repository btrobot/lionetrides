import type { users } from '@/db/schema';
type User = typeof users.$inferSelect;

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: '测试用户',
    email: 'test@example.com',
    password_hash: '$2b$10$hashed_password_string',
    role: 'customer',
    is_active: true,
    phone: null,
    company: null,
    country: null,
    avatar_url: null,
    email_verified_at: null,
    login_attempts: 0,
    locked_until: null,
    last_login_at: null,
    deleted_at: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildUserList(count: number): User[] {
  return Array.from({ length: count }, (_, i) =>
    buildUser({
      id: i + 1,
      name: `用户 ${i + 1}`,
      email: `user${i + 1}@example.com`,
    })
  );
}