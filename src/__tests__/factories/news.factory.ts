import type { news } from '@/db/schema';
type News = typeof news.$inferSelect;

export function buildNews(overrides: Partial<News> = {}): News {
  return {
    id: 1,
    title: '测试新闻标题',
    slug: 'test-news',
    summary: '这是一条测试新闻摘要',
    content: '这是一条测试新闻的详细内容...',
    cover_image: null,
    category: 'company',
    tags: [],
    author: '管理员',
    is_published: true,
    published_at: null,
    view_count: 0,
    meta_title: null,
    meta_description: null,
    deleted_at: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildNewsList(count: number): News[] {
  return Array.from({ length: count }, (_, i) =>
    buildNews({
      id: i + 1,
      title: `新闻标题 ${i + 1}`,
      slug: `news-${i + 1}`,
      category: i % 3 === 0 ? 'industry' : i % 3 === 1 ? 'company' : 'product',
    })
  );
}