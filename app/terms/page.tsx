import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactEmail, LegalPage, LegalSection } from '@/components/legal-page';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Términos de uso',
  description: 'Las reglas básicas para usar Careff.',
};

// Rendered per request so CONTACT_EMAIL can be set at deploy time, not build time.
export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <LegalPage title="Términos de uso" updated="noviembre de 2026">
      <LegalSection title="Qué es Careff">
        <p>
          Careff es una herramienta gratuita para organizar viajes compartidos entre gente que ya se
          conoce: decide qué auto busca a cada persona y arma la ruta de cada conductor. No es un
          servicio de transporte ni conecta a desconocidos.
        </p>
      </LegalSection>

      <LegalSection title="Tu cuenta">
        <ul>
          <li>Usá un email tuyo y mantené tu contraseña en privado.</li>
          <li>Sos responsable de lo que se haga desde tu cuenta.</li>
          <li>Podés pedir que la eliminemos cuando quieras.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Uso correcto">
        <ul>
          <li>Cargá datos de otras personas solo si están de acuerdo.</li>
          <li>No uses Careff para algo ilegal ni para molestar a otros.</li>
          <li>
            No automatices consultas masivas: el servicio depende de proveedores de datos abiertos
            con cupos de uso justo, y podemos limitar o bloquear el abuso.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Las rutas son una estimación">
        <p>
          Las distancias, los tiempos, las rutas y los gastos de nafta son cálculos aproximados
          hechos con datos abiertos, que pueden tener errores o estar desactualizados. Cada
          conductor decide por dónde ir y es responsable de manejar con cuidado y respetar las
          normas de tránsito.
        </p>
      </LegalSection>

      <LegalSection title="Sin garantías">
        <p>
          Careff se ofrece tal cual está, sin garantía de que funcione siempre ni de que esté libre
          de errores. En la medida que la ley lo permita, no respondemos por daños derivados de su
          uso, incluidos viajes, demoras o gastos que resulten de un plan.
        </p>
      </LegalSection>

      <LegalSection title="Cambios y cierre">
        <p>
          Podemos modificar o discontinuar el servicio, y suspender cuentas que incumplan estos
          términos. Si cambiamos los términos de forma importante, lo avisamos en el sitio.
        </p>
      </LegalSection>

      <LegalSection title="Privacidad y contacto">
        <p>
          El tratamiento de tus datos se explica en la{' '}
          <Link href="/privacy" className="link-sweep link-amber">
            política de privacidad
          </Link>
          . Por cualquier consulta escribí a <ContactEmail email={env.CONTACT_EMAIL} />.
        </p>
      </LegalSection>

      <LegalSection title="Ley aplicable">
        <p>Estos términos se rigen por las leyes de la República Argentina.</p>
      </LegalSection>
    </LegalPage>
  );
}
