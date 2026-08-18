import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return [
    { url: `${appUrl}/`, changeFrequency: 'monthly' as const, priority: 1 },
    { url: `${appUrl}/planner`, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${appUrl}/register`, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${appUrl}/login`, changeFrequency: 'monthly' as const, priority: 0.4 },
  ];
}
