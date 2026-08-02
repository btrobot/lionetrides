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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans bg-white text-gray-900">{children}</body>
    </html>
  );
}