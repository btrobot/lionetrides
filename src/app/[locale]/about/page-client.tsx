'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Award, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AnimatedSection from '@/components/shared/animated-section';
import CountUp from '@/components/shared/count-up';
import { useSiteConfig } from '@/providers/site-config-provider';
import type { Locale } from '@/i18n/routing';

interface Milestone {
  year: string;
  title: string;
  desc: string;
}

interface TeamMember {
  name: string;
  role: string;
  desc: string;
}

interface StatItem {
  label: string;
  value: number;
  suffix: string;
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function AboutPage() {
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;
  const { config } = useSiteConfig();

  const milestones = parseJson<Milestone[]>(config.about_milestones, []);
  const team = parseJson<TeamMember[]>(config.about_team, []);
  const stats = parseJson<StatItem[]>(config.about_stats, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            {config.about_hero_title || 'About RideCraft Industries'}
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            {config.about_hero_desc || 'For over 25 years, we have been designing and manufacturing world-class amusement rides.'}
          </p>
        </div>
      </section>

      {/* Stats */}
      <AnimatedSection className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {config.about_mission_title || 'Our Mission'}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {config.about_mission_desc || 'To create unforgettable experiences through innovative, safe, and sustainable amusement rides.'}
              </p>
            </Card>
            <Card className="border-0 p-8">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {config.about_vision_title || 'Our Vision'}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {config.about_vision_desc || 'To be the world\'s most trusted partner for amusement ride solutions.'}
              </p>
            </Card>
          </div>
        </div>
      </AnimatedSection>

      {/* Timeline */}
      {milestones.length > 0 && (
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
      )}

      {/* Team */}
      {team.length > 0 && (
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
      )}

      {/* CTA */}
      <AnimatedSection className="bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {config.about_cta_title || 'Ready to Partner With Us?'}
          </h2>
          <p className="text-blue-200 mb-8 max-w-2xl mx-auto">
            {config.about_cta_desc || 'Let\'s discuss how we can bring your vision to life.'}
          </p>
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