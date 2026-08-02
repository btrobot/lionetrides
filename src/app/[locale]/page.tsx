'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Star,
  Package,
  Ruler,
  Users,
  Wrench,
  CheckCircle2,
  MessageSquare,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AnimatedSection from '@/components/shared/animated-section';
import CountUp from '@/components/shared/count-up';
import { useInquiry } from '@/components/shared/inquiry-dialog';
import { useHomeData, getCategoryGradient, getCategoryIcon } from '@/hooks/use-home-data';
import type { Locale } from '@/i18n/routing';
import type { HomeProduct, FactoryFeature, ProcessStep, HomeStat } from '@/hooks/use-home-data';

export default function HomePage() {
  const t = useTranslations('home');
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;
  const { openInquiry } = useInquiry();
  const data = useHomeData();

  const iconMap: Record<string, React.ElementType> = {
    Ruler, Users, CheckCircle2, Wrench,
    Package, MessageSquare, FileText,
  };

  return (
    <>
      {/* ─── Hero ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20">
              {t('hero_badge')}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              {t('hero_title')}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl leading-relaxed">
              {t('hero_subtitle')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href={`/${currentLocale}/products`}>
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 px-8 text-base">
                  {t('explore_products')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8 text-base"
                onClick={() => openInquiry()}
              >
                {t('send_inquiry')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────── */}
      {data.stats.length > 0 && (
        <AnimatedSection className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {data.stats.map((stat: HomeStat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-blue-600 mb-2">
                    <CountUp end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ─── Categories ─────────────────────────────── */}
      {data.categories.length > 0 && (
        <AnimatedSection className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{t('categories_title')}</h2>
              <p className="mt-4 text-gray-500 max-w-2xl mx-auto">{t('categories_subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.categories.map((cat) => (
                <Link key={cat.id} href={`/${currentLocale}/products?category=${cat.slug}`}>
                  <Card className="group relative overflow-hidden border-0 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(cat.slug)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-3xl mb-3 block">{getCategoryIcon(cat.slug)}</span>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{cat.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{cat.product_count ?? 0} Models</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ─── Featured Products ──────────────────────── */}
      {data.products.length > 0 && (
        <AnimatedSection className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{t('featured_title')}</h2>
                <p className="mt-2 text-gray-500">{t('featured_subtitle')}</p>
              </div>
              <Link href={`/${currentLocale}/products`} className="hidden sm:flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm">
                {t('view_all')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} locale={currentLocale} />
              ))}
            </div>
            {data.products.length > 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {data.products.slice(4, 8).map((product) => (
                  <ProductCard key={product.id} product={product} locale={currentLocale} />
                ))}
              </div>
            )}
            <div className="text-center mt-10 sm:hidden">
              <Link href={`/${currentLocale}/products`}>
                <Button variant="outline" className="gap-2">
                  {t('view_all')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ─── Certifications ─────────────────────────── */}
      {data.certifications.length > 0 && (
        <AnimatedSection className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">{t('certifications_title')}</p>
            <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12">
              {data.certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-sm border border-gray-100"
                >
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">{cert.name}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ─── Partners Logo Wall ──────────────────────── */}
      {data.partners.length > 0 && (
        <AnimatedSection className="bg-white py-16 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-10">{t('partners_title')}</p>
            <div className="relative">
              <div className="flex gap-12 animate-scroll hover:[animation-play-state:paused]">
                {[...data.partners, ...data.partners].map((partner, i) => (
                  <div key={`${partner.id}-${i}`} className="flex-shrink-0 flex items-center justify-center h-16 px-6 bg-gray-50 rounded-xl border border-gray-100 min-w-[160px]">
                    {partner.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={partner.logo_url} alt={partner.name} className="h-8 object-contain opacity-50 grayscale" />
                    ) : (
                      <span className="text-sm font-semibold text-gray-400 whitespace-nowrap">{partner.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ─── Factory Strength ────────────────────────── */}
      {data.factoryFeatures.length > 0 && (
        <AnimatedSection className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('factory_title')}</h2>
              <p className="mt-4 text-blue-200 max-w-2xl mx-auto">{t('factory_subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.factoryFeatures.map((feature: FactoryFeature) => {
                const Icon = iconMap[feature.icon] || Package;
                return (
                  <Card key={feature.title} className="bg-white/10 border-0 backdrop-blur-sm p-6 text-center hover:bg-white/15 transition-colors">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/30 mb-4">
                      <Icon className="h-6 w-6 text-blue-200" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-blue-200 leading-relaxed">{feature.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ─── Inquiry Process ─────────────────────────── */}
      {data.processSteps.length > 0 && (
        <AnimatedSection className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{t('process_title')}</h2>
              <p className="mt-4 text-gray-500 max-w-2xl mx-auto">{t('process_subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {data.processSteps.map((step: ProcessStep, index: number) => {
                const StepIcon = iconMap[step.step === 1 ? 'MessageSquare' : step.step === 2 ? 'FileText' : 'Package'] || Package;
                return (
                  <div key={step.title} className="relative text-center">
                    {index < data.processSteps.length - 1 && (
                      <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 border-t-2 border-dashed border-gray-200" />
                    )}
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-50 mb-6 relative">
                      <StepIcon className="h-10 w-10 text-blue-600" />
                      <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">{step.desc}</p>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-10">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                onClick={() => openInquiry()}
              >
                {t('start_inquiry')} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ─── News ────────────────────────────────────── */}
      {data.news.length > 0 && (
        <AnimatedSection className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{t('news_title')}</h2>
                <p className="mt-2 text-gray-500">{t('news_subtitle')}</p>
              </div>
              <Link href={`/${currentLocale}/news`} className="hidden sm:flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm">
                {t('view_all')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.news.map((item) => (
                <Link key={item.id} href={`/${currentLocale}/news/${item.id}`}>
                  <Card className="border-0 p-6 hover:shadow-lg transition-all duration-300 h-full">
                    <Badge variant="secondary" className="mb-3">{item.category}</Badge>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.date}</p>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8 sm:hidden">
              <Link href={`/${currentLocale}/news`}>
                <Button variant="outline" className="gap-2">
                  {t('view_all')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ─── Loading Overlay (initial only) ──────────── */}
      {data.loading && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      )}
    </>
  );
}

function ProductCard({ product, locale }: { product: HomeProduct; locale: string }) {
  const th = useTranslations('home');
  const { openInquiry } = useInquiry();
  return (
    <Link href={`/${locale}/products/${product.id}`}>
      <Card className="group border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="aspect-[3/2] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">{product.category}</div>
          {product.specs && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-gray-600 font-medium">{product.specs}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{product.name}</h3>
            {product.rating && (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-xs font-medium">{product.rating}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-3">{product.category}</p>
          <Button
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={(e) => {
              e.preventDefault();
              openInquiry(product.id);
            }}
          >
            {th('send_inquiry')}
          </Button>
        </div>
      </Card>
    </Link>
  );
}