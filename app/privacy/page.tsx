import type { Metadata } from 'next';
import { ContactEmail, LegalPage, LegalSection } from '@/components/legal-page';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Qué datos guarda Careff, para qué los usa y cómo pedir que se borren.',
};

// Rendered per request so CONTACT_EMAIL can be set at deploy time, not build time.
export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  const contact = <ContactEmail email={env.CONTACT_EMAIL} />;

  return (
    <LegalPage title="Política de privacidad" updated="noviembre de 2026">
      <LegalSection title="En pocas palabras">
        <p>
          Careff guarda lo mínimo para armar tus viajes compartidos: tu cuenta, los planes que
          decidís guardar y los grupos que creás. No vendemos tus datos ni los usamos para otra
          cosa.
        </p>
      </LegalSection>

      <LegalSection title="Qué datos guardamos">
        <ul>
          <li>
            <strong>Tu cuenta:</strong> nombre, email y, si elegiste una, tu contraseña guardada de
            forma cifrada (nunca en texto legible). Si entrás con Google, recibimos de Google solo
            tu nombre y tu email.
          </li>
          <li>
            <strong>Tus preferencias:</strong> el país y la provincia que elegís, y la dirección de
            salida que usás habitualmente.
          </li>
          <li>
            <strong>Tus planes guardados:</strong> título, destino, y los nombres y direcciones de
            conductores y pasajeros que cargaste, junto con las rutas calculadas.
          </li>
          <li>
            <strong>Tus grupos:</strong> el nombre del grupo y, por cada persona que se suma con el
            link de invitación, su nombre, su dirección de salida, si lleva auto y cuántos asientos
            tiene.
          </li>
        </ul>
        <p>
          Si usás el planificador sin cuenta, el plan se calcula pero no se guarda en nuestros
          servidores.
        </p>
      </LegalSection>

      <LegalSection title="Datos de otras personas">
        <p>
          Para organizar un viaje cargás nombres y direcciones de gente de tu grupo. Hacelo solo con
          personas que estén de acuerdo. Quien figure en un plan o grupo puede pedirnos que borremos
          sus datos escribiendo a {contact}.
        </p>
      </LegalSection>

      <LegalSection title="Links para compartir">
        <p>
          Un plan compartido o una invitación a un grupo se abre con un link secreto. Cualquiera que
          tenga ese link puede ver el plan (nombres, direcciones y rutas) o sumarse al grupo.
          Compartilo solo con quien corresponda.
        </p>
      </LegalSection>

      <LegalSection title="Servicios externos que intervienen">
        <ul>
          <li>
            <strong>Georef (Estado argentino), Nominatim (OpenStreetMap) y OSRM:</strong> reciben
            las direcciones y coordenadas que cargás, para ubicarlas y medir distancias. Las
            consultas salen desde nuestro servidor, sin tu nombre ni tu cuenta.
          </li>
          <li>
            <strong>OpenStreetMap:</strong> tu navegador le pide directamente las imágenes del mapa,
            así que ese servicio ve tu dirección IP y la zona que estás mirando.
          </li>
          <li>
            <strong>Google Fonts:</strong> tu navegador descarga de Google las tipografías del
            sitio.
          </li>
          <li>
            <strong>Google (inicio de sesión):</strong> solo si elegís &quot;Continuar con
            Google&quot;.
          </li>
          <li>
            <strong>Resend:</strong> envía nuestros emails de confirmación y de recuperación de
            contraseña, para lo cual recibe tu email y tu nombre.
          </li>
          <li>
            <strong>WhatsApp y Google Maps:</strong> solo cuando vos tocás el botón para compartir
            una ruta o abrirla en el navegador GPS.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies y datos en tu dispositivo">
        <ul>
          <li>
            <strong>Sesión:</strong> una cookie que te mantiene con la sesión iniciada.
          </li>
          <li>
            <strong>Perfil de invitado:</strong> si te sumás a un grupo sin cuenta, una cookie
            recuerda durante un año tu nombre, dirección y auto para no pedírtelos de nuevo.
          </li>
          <li>
            <strong>Región:</strong> el país y la provincia elegidos se guardan en tu navegador.
          </li>
        </ul>
        <p>
          No usamos cookies de publicidad ni de seguimiento. Si das permiso de ubicación, la usamos
          una sola vez para sugerirte tu provincia y no la guardamos.
        </p>
      </LegalSection>

      <LegalSection title="Cuánto tiempo los guardamos">
        <p>
          Mientras tu cuenta exista. Al borrar tu cuenta se eliminan también tus planes y tus
          grupos, con los datos de sus integrantes.
        </p>
      </LegalSection>

      <LegalSection title="Tus derechos">
        <p>
          Podés pedir acceso a tus datos, corregirlos o eliminarlos (incluida tu cuenta completa)
          escribiendo a {contact}. Respondemos dentro de los plazos de la Ley 25.326 de Protección
          de Datos Personales.
        </p>
        <p>
          La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende
          las denuncias y reclamos de quienes consideren afectados sus derechos sobre datos
          personales.
        </p>
      </LegalSection>

      <LegalSection title="Cambios">
        <p>
          Si cambiamos esta política de forma importante, lo avisamos en el sitio y actualizamos la
          fecha de arriba.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
