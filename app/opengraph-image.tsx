import { ImageResponse } from 'next/og';

/**
 * Site-wide OpenGraph image (1200×630) rendered at request time — this is the
 * card WhatsApp/Twitter/Slack show when a Careff link is shared. Drawn with
 * the brand glyph (white stem, amber arms) on the app's dark background so it
 * matches the UI without shipping any binary asset.
 */

export const alt = 'Careff — ¿Quién lleva a quién? Resuelto en un minuto';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: '#030712',
        color: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <svg width="72" height="86" viewBox="10 8 25 30">
          <rect x="13" y="11" width="3" height="26" fill="#FFFFFF" />
          <path
            d="M16 11 L27 11 L33 17.5"
            stroke="#FBBF24"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M16 37 L27 37 L33 30.5"
            stroke="#FBBF24"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="14.5" cy="11" r="2.8" fill="#FFFFFF" />
        </svg>
        <div style={{ display: 'flex', fontSize: '64px', fontWeight: 700, marginLeft: '4px' }}>
          areff
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: '48px',
          fontSize: '58px',
          fontWeight: 700,
          lineHeight: 1.15,
        }}
      >
        <div style={{ display: 'flex' }}>¿Quién lleva a quién?</div>
        <div style={{ display: 'flex', color: '#FBBF24' }}>Resuelto en un minuto.</div>
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: '40px',
          fontSize: '28px',
          color: '#94a3b8',
        }}
      >
        Viajes compartidos gratis · rutas reales · compartilo por WhatsApp
      </div>
    </div>,
    size,
  );
}
