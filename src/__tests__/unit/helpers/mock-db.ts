import { vi } from 'vitest';

export function createMockDb(): any {
  const defaultInsertReturn = [{ id: 1, createdAt: new Date() }];
  const defaultSelectReturn: any[] = [];

  const mockDb = {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve(defaultInsertReturn)),
      })),
    })),
    select: vi.fn(() => createSelectMock(defaultSelectReturn)),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve(defaultInsertReturn)),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve(defaultInsertReturn)),
      })),
    })),
    $count: vi.fn(() => Promise.resolve(0)),
    transaction: vi.fn((fn: (tx: any) => any) => fn(mockDb)),
  };

  return mockDb;
}

function createSelectMock(returnValue: any[]) {
  const chain = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    groupBy: vi.fn(() => chain),
    having: vi.fn(() => chain),
    then: vi.fn((resolve: any) => resolve(returnValue)),
    catch: vi.fn(),
  };

  // Make it thenable (Promise-like)
  chain.then.mockImplementation((resolve: any) => {
    if (resolve) return Promise.resolve(resolve(returnValue));
    return Promise.resolve(returnValue);
  });

  return chain;
}

export function resetMockDb(mockDb: any) {
  vi.clearAllMocks();
}