import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'RideCraft Industries | Amusement Ride Manufacturer',
    template: '%s | RideCraft Industries',
  },
  description:
    'Leading manufacturer of amusement rides since 1995. Roller coasters, Ferris wheels, carousels, water park rides and more. B2B manufacturing for theme parks worldwide.',
  keywords: [
    'amusement rides',
    'roller coaster manufacturer',
    'ferris wheel',
    'carousel',
    'water park equipment',
    'theme park rides',
    'B2B',
    'ride manufacturer',
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RideCraft Industries',
  url: process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://ridecraft.com',
  logo: 'https://ridecraft.com/logo.png',
  description:
    'Leading manufacturer of amusement rides since 1995. Roller coasters, Ferris wheels, carousels, water park rides and more.',
  foundingDate: '1995',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+86-20-8888-8888',
    contactType: 'sales',
    availableLanguage: ['English', 'Chinese'],
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Guangzhou',
    addressCountry: 'CN',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans bg-white text-gray-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}