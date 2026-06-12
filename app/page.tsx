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

      <section className="px-4 pb-16 pt-20 text-center">
        <p className="mx-auto mb-4 w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
          Gratis para siempre · Sin tarjeta de crédito
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          ¿Quién lleva a quién? <span className="text-amber-400">Resuelto en un minuto.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
          Para cumpleaños, partidos, salidas del club o cualquier plan en grupo: Careff decide qué
          auto busca a cada persona y arma la mejor ruta para cada conductor.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/planner" className="btn-glow rounded-xl px-6 py-3 text-base">
            Probalo ahora — sin registrarte
          </Link>
          <Link href="/register" className="btn-glass rounded-xl px-6 py-3 text-base font-semibold">
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-white">Cómo funciona</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm"
            >
              <p className="text-3xl">{step.emoji}</p>
              <p className="mt-3 text-sm font-semibold text-amber-400">Paso {i + 1}</p>
              <h3 className="mt-1 font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/30 px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-white">
            Pensado para que lo uses (y lo vuelvas a usar)
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([emoji, title, text]) => (
              <div
                key={title}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm"
              >
                <p className="text-2xl">{emoji}</p>
                <h3 className="mt-2 font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-white">
          El grupo ya tiene ganas de ir. Falta decidir quién maneja.
        </h2>
        <Link href="/planner" className="btn-glow mt-6 inline-block rounded-xl px-8 py-3 text-base">
          Armar mi primer viaje
        </Link>
      </section>

      <footer className="border-t border-slate-800 px-4 py-6 text-center text-sm text-slate-500">
        🚗 Careff — viajes compartidos sin esfuerzo · Hecho con datos abiertos de OpenStreetMap
      </footer>
    </div>
  );
}
