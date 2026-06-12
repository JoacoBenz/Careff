import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Careff — ¿Quién lleva a quién? Resuelto en un minuto',
  description:
    'Organizá viajes compartidos gratis: Careff asigna cada pasajero al auto más cercano, arma la ruta de cada conductor y la comparte por WhatsApp.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
