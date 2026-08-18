import type { MetadataRoute } from 'next';

// Web app manifest: lets people "add Careff to home screen" with the brand
// icon and dark splash, which fits the WhatsApp-first mobile usage.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Careff — viajes compartidos',
    short_name: 'Careff',
    description:
      'Organizá viajes compartidos gratis: cada pasajero al auto más cercano, rutas reales y compartir por WhatsApp.',
    start_url: '/',
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#030712',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
