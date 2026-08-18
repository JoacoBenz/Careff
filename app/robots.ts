import type { MetadataRoute } from 'next';

// Only the public marketing/auth surfaces are indexable. Share links
// (/p/<token>, /join/<token>) are secret-URL pages and must never be crawled;
// groups/plans/profile are behind login anyway.
export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/planner', '/login', '/register'],
        disallow: ['/api/', '/groups', '/plans', '/profile', '/p/', '/join/'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
