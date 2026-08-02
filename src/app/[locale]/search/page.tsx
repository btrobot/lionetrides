'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, FileText, Package, Loader2, ChevronRight, Calendar, Tag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductResult {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  main_image: string | null;
  price: string | null;
  category_name?: string;
  brand_name?: string;
}

interface NewsResult {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  cover_image: string | null;
  category: string | null;
  published_at: string | null;
}

interface SearchData {
  products: ProductResult[];
  news: NewsResult[];
  total: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(query);
  const [results, setResults] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}&type=all`);
      const json = await res.json();
      if (json.success) {
        setResults(json.data);
      } else {
        setError(json.error || '搜索失败');
      }
    } catch {
      setError('搜索请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      setInputValue(query);
      doSearch(query);
    }
  }, [query, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const total = results ? results.products.length + results.news.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={'搜索产品、新闻...'}
              className="w-full rounded-xl border-gray-200 pl-12 py-6 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700"
            >
              {/* {t('search') || '搜索'} */}搜索
            </Button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-2">{error}</p>
            <Button variant="outline" onClick={() => doSearch(query)}>
              重试
            </Button>
          </div>
        )}

        {!loading && !error && query && results && (
          <>
            {/* Summary */}
            <p className="text-sm text-gray-500 mb-6">
              找到 <span className="font-semibold text-gray-900">{results.total}</span> 条与「
              <span className="font-semibold text-gray-900">{query}</span>」相关的结果
            </p>

            {total === 0 && (
              <div className="text-center py-20">
                <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关结果</h3>
                <p className="text-gray-500">试试其他关键词，或浏览我们的产品分类</p>
                <div className="flex gap-3 justify-center mt-6">
                  <Link href="/products">
                    <Button variant="outline">浏览产品</Button>
                  </Link>
                  <Link href="/news">
                    <Button variant="outline">浏览新闻</Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Products Section */}
            {results.products.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    产品 ({results.products.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {results.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-100 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        {product.main_image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.main_image}
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {product.price && (
                              <span className="text-sm font-semibold text-blue-600">
                                ¥{product.price}
                              </span>
                            )}
                            {product.category_name && (
                              <Badge variant="secondary" className="text-xs">
                                {product.category_name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* News Section */}
            {results.news.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    新闻 ({results.news.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {results.news.map((article) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-orange-100 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        {article.cover_image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={article.cover_image}
                            alt={article.title}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 group-hover:text-orange-500 transition-colors truncate">
                            {article.title}
                          </h3>
                          {article.summary && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {article.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            {article.published_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(article.published_at).toLocaleDateString('zh-CN')}
                              </span>
                            )}
                            {article.category && (
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {article.category === 'company' ? '公司新闻' : article.category === 'industry' ? '行业动态' : '技术文章'}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-orange-500 flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {!loading && !query && (
          <div className="text-center py-20">
            <Search className="mx-auto h-16 w-16 text-gray-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">搜索产品与新闻</h3>
            <p className="text-gray-500">输入关键词，查找你感兴趣的产品或资讯</p>
          </div>
        )}
      </div>
    </div>
  );
}