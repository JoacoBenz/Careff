import type { Metadata, Viewport } from 'next';
import { CityPulse } from '@/components/city-pulse';
import './globals.css';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const title = 'Careff — ¿Quién lleva a quién? Resuelto en un minuto';
const description =
  'Organizá viajes compartidos gratis: Careff asigna cada pasajero al auto más cercano, arma la ruta de cada conductor y la comparte por WhatsApp.';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: title,
    template: '%s · Careff',
  },
  description,
  applicationName: 'Careff',
  // OG/Twitter defaults: WhatsApp and social link previews for every page;
  // the image comes from app/opengraph-image.tsx.
  openGraph: {
    title,
    description,
    url: appUrl,
    siteName: 'Careff',
    type: 'website',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: '#030712',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* App Router root layout: this stylesheet applies to every page; the
            rule below only knows the legacy pages/ directory. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#030712]">
        <CityPulse />
        {children}
      </body>
    </html>
  );
}
