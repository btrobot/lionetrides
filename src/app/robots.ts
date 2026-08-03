import { MetadataRoute } from 'next';

const BASE_URL = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://ridecraft.dev';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/static/', '/admin'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
