import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';

const steps = [
  {
    emoji: '📝',
    title: 'Cargá tu grupo',
    text: 'Quiénes manejan (y cuántos asientos libres tienen), quiénes necesitan que los lleven, y el destino.',
  },
  {
    emoji: '⚡',
    title: 'Careff arma las rutas',
    text: 'Con varios autos, cada pasajero va en el que menos desvía su ruta: el conjunto de viajes más corto posible, con distancias reales.',
  },
  {
    emoji: '💬',
    title: 'Compartí por WhatsApp',
    text: 'Un toque y cada conductor tiene su ruta en el teléfono, con el link de Google Maps listo para navegar.',
  },
];

const features = [
  ['💸', '100% gratis', 'Sin tarjeta, sin límites, sin versión "pro". Gratis de verdad.'],
  [
    '🙅',
    'Sin registro para probar',
    'Calculá tu primer plan sin crear cuenta. Registrate solo si querés guardarlo.',
  ],
  ['🔗', 'Planes compartibles', 'Cada plan guardado tiene un link público para mandar al grupo.'],
  [
    '📍',
    'Direcciones inteligentes',
    'Autocompletado de direcciones para que nada quede mal escrito.',
  ],
  ['🗺️', 'Rutas reales', 'Distancias por calle (no línea recta) y navegación con Google Maps.'],
  ['🔒', 'Tus datos son tuyos', 'Solo guardamos lo que vos decidís guardar. Nada de publicidad.'],
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="bg-gradient-to-b from-emerald-50/80 to-transparent px-4 pb-16 pt-20 text-center">
        <p className="mx-auto mb-4 w-fit rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700">
          Gratis para siempre · Sin tarjeta de crédito
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          ¿Quién lleva a quién? <span className="text-emerald-600">Resuelto en un minuto.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Para cumpleaños, partidos, salidas del club o cualquier plan en grupo: Careff decide qué
          auto busca a cada persona y arma la mejor ruta para cada conductor.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/planner"
            className="rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-emerald-700"
          >
            Probalo ahora — sin registrarte
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-slate-900">Cómo funciona</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 p-6">
              <p className="text-3xl">{step.emoji}</p>
              <p className="mt-3 text-sm font-semibold text-emerald-700">Paso {i + 1}</p>
              <h3 className="mt-1 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50/70 px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Pensado para que lo uses (y lo vuelvas a usar)
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([emoji, title, text]) => (
              <div key={title} className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-2xl">{emoji}</p>
                <h3 className="mt-2 font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          El grupo ya tiene ganas de ir. Falta decidir quién maneja.
        </h2>
        <Link
          href="/planner"
          className="mt-6 inline-block rounded-xl bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-md hover:bg-emerald-700"
        >
          Armar mi primer viaje
        </Link>
      </section>

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
        🚗 Careff — viajes compartidos sin esfuerzo · Hecho con datos abiertos de OpenStreetMap
      </footer>
    </div>
  );
}
