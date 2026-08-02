'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Building2, Award, Target, Users, History, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AnimatedSection from '@/components/shared/animated-section';
import CountUp from '@/components/shared/count-up';
import type { Locale } from '@/i18n/routing';

const milestones = [
  { year: '2000', title: 'Founded', desc: 'RideCraft Industries established in Shanghai' },
  { year: '2005', title: 'First Export', desc: 'Exported first coaster to Southeast Asia' },
  { year: '2010', title: 'R&D Center', desc: 'Opened 10,000㎡ R&D center' },
  { year: '2015', title: 'Global Expansion', desc: 'Entered European and Middle Eastern markets' },
  { year: '2020', title: 'Smart Factory', desc: 'Launched 50,000㎡ smart manufacturing facility' },
  { year: '2025', title: 'Industry Leader', desc: '200+ products, 60 countries, 86 patents' },
];

const team = [
  { name: 'Dr. Zhang Wei', role: 'Founder & CEO', desc: '30+ years in amusement ride industry' },
  { name: 'Li Ming', role: 'Chief Engineer', desc: 'Led 50+ coaster design projects' },
  { name: 'Sarah Chen', role: 'VP of Global Sales', desc: '20+ years in B2B international sales' },
  { name: 'Wang Fang', role: 'Head of R&D', desc: '25+ patents in ride technology' },
];

export default function AboutPage() {
  const t = useTranslations('about');
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">About RideCraft Industries</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            For over 25 years, we have been designing and manufacturing world-class amusement rides that bring joy to millions of visitors across 60 countries.
          </p>
        </div>
      </section>

      {/* Stats */}
      <AnimatedSection className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Years Experience', value: 25, suffix: '+' },
              { label: 'Products Delivered', value: 2000, suffix: '+' },
              { label: 'Countries Served', value: 60, suffix: '+' },
              { label: 'Happy Clients', value: 500, suffix: '+' },
            ].map((stat) => (
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

      {/* Mission & Vision */}
      <AnimatedSection className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="border-0 p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                To create unforgettable experiences through innovative, safe, and sustainable amusement rides. We are committed to pushing the boundaries of ride technology while maintaining the highest standards of safety and quality.
              </p>
            </Card>
            <Card className="border-0 p-8">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                To be the world's most trusted partner for amusement ride solutions, setting the global standard for ride safety, innovation, and customer satisfaction.
              </p>
            </Card>
          </div>
        </div>
      </AnimatedSection>

      {/* Timeline */}
      <AnimatedSection className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-px h-full w-0.5 bg-gray-200 hidden md:block" />
            <div className="space-y-12">
              {milestones.map((m, i) => (
                <div key={m.year} className={`relative flex items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="hidden md:block flex-1" />
                  <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow hidden md:block" />
                  <div className="flex-1">
                    <Card className="border-0 bg-gray-50 p-6">
                      <span className="text-sm font-bold text-blue-600">{m.year}</span>
                      <h3 className="text-lg font-semibold text-gray-900 mt-1">{m.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{m.desc}</p>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Team */}
      <AnimatedSection className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Leadership Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="border-0 p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-blue-600 font-medium mb-2">{member.role}</p>
                <p className="text-xs text-gray-500">{member.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection className="bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Partner With Us?</h2>
          <p className="text-blue-200 mb-8 max-w-2xl mx-auto">Let's discuss how we can bring your vision to life with our world-class amusement ride solutions.</p>
          <Link href={`/${currentLocale}/products`}>
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 px-8">
              Explore Products <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </AnimatedSection>
    </div>
  );
}