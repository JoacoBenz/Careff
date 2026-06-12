import type { Metadata } from 'next';
import { CityPulse } from '@/components/city-pulse';
import './globals.css';

export const metadata: Metadata = {
  title: 'Careff — ¿Quién lleva a quién? Resuelto en un minuto',
  description:
    'Organizá viajes compartidos gratis: Careff asigna cada pasajero al auto más cercano, arma la ruta de cada conductor y la comparte por WhatsApp.',
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
