import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';
import { SiteHeader } from '@/components/site-header';
import { HeroVisual } from '@/components/hero-visual';
import { Reveal } from '@/components/reveal';
import {
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  ChevronDownIcon,
  GiftIcon,
  LinkIcon,
  PinIcon,
  RouteIcon,
  ShieldIcon,
  UsersIcon,
  WalletIcon,
  WhatsAppIcon,
} from '@/components/icons';

const occasions = [
  'Cumpleaños',
  'Fútbol de los jueves',
  'Salidas del club',
  'Casamientos',
  'Recitales',
  'Viajes del cole',
  'Asados',
  'Torneos',
  'Escapadas de finde',
  'After office',
];

const steps: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <UsersIcon className="h-6 w-6" />,
    title: 'Cargá tu grupo',
    text: 'Quiénes manejan (y cuántos asientos libres tienen), quiénes necesitan que los lleven, y el destino.',
  },
  {
    icon: <BoltIcon className="h-6 w-6" />,
    title: 'Careff arma las rutas',
    text: 'Con varios autos, cada pasajero va en el que menos desvía su ruta: el conjunto de viajes más corto posible, con distancias reales.',
  },
  {
    icon: <WhatsAppIcon className="h-6 w-6" />,
    title: 'Compartí por WhatsApp',
    text: 'Un toque y cada conductor tiene su ruta en el teléfono, con el link de Google Maps listo para navegar.',
  },
];

const facts = [
  ['$0', 'para siempre, sin versión "pro"'],
  ['1 min', 'de cargar el grupo al plan listo'],
  ['10 × 30', 'hasta 10 autos y 30 pasajeros'],
  ['0', 'cuentas necesarias para probar'],
];

const faqs = [
  [
    '¿De verdad es gratis?',
    'Sí. Careff usa datos abiertos (Georef, OpenStreetMap y OSRM) para ubicar direcciones y medir distancias, así que no hay costos que trasladarte. Sin tarjeta, sin límites escondidos.',
  ],
  [
    '¿Necesito crear una cuenta?',
    'No para probarlo: armás un plan completo sin registrarte. La cuenta sirve para guardar tus planes, compartirlos con un link y crear grupos que se arman solos por invitación.',
  ],
  [
    '¿Cómo decide qué auto busca a cada persona?',
    'Prueba todas las combinaciones razonables y elige la que suma menos kilómetros en total, usando distancias reales por calle y no línea recta. No es "el conductor más cercano": es lo mejor para el grupo entero.',
  ],
  [
    '¿Los demás tienen que instalar algo?',
    'Nada. A cada conductor le llega su ruta por WhatsApp con un link de Google Maps, y el plan completo se ve desde cualquier navegador.',
  ],
  [
    '¿Sirve para dividir la nafta?',
    'Sí. Careff estima el gasto de cada auto con la distancia de su ruta, suma peajes si querés, y te dice cuánto pone cada pasajero (ida sola o ida y vuelta).',
  ],
];

function Feature({
  icon,
  title,
  text,
  className = '',
  children,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`surface surface-link h-full overflow-hidden p-6 ${className}`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-300 ring-1 ring-amber-400/25">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-dim)]">{text}</p>
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <SiteHeader />

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr]">
        <span
          className="pointer-events-none absolute -top-24 left-1/2 h-[30rem] w-[52rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]"
          aria-hidden
        />
        <div className="relative text-center lg:text-left">
          <p className="chip chip-amber rise">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            Gratis para siempre · Sin tarjeta de crédito
          </p>
          <h1
            className="rise mt-5 text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl"
            style={{ ['--d' as string]: '80ms' }}
          >
            ¿Quién lleva
            <br />a quién?
            <span className="text-gradient block">Resuelto en un minuto.</span>
          </h1>
          <p
            className="rise mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-300 lg:mx-0"
            style={{ ['--d' as string]: '160ms' }}
          >
            Para cumpleaños, partidos, salidas del club o cualquier plan en grupo: Careff decide qué
            auto busca a cada persona y arma la mejor ruta para cada conductor.
          </p>
          <div
            className="rise mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
            style={{ ['--d' as string]: '240ms' }}
          >
            <Link href="/planner" className="btn-glow rounded-2xl px-6 py-3.5 text-base">
              Probalo ahora — sin registrarte
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/register"
              className="btn-glass rounded-2xl px-6 py-3.5 text-base font-semibold"
            >
              Crear cuenta gratis
            </Link>
          </div>
          <ul
            className="rise mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[var(--ink-dim)] lg:justify-start"
            style={{ ['--d' as string]: '320ms' }}
          >
            {['Distancias reales por calle', 'Rutas por WhatsApp', 'Divide la nafta'].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-amber-300" strokeWidth={2.4} />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="rise relative pb-32" style={{ ['--d' as string]: '200ms' }}>
          <HeroVisual />
        </div>
      </section>

      {/* Occasions marquee */}
      <section aria-label="Para qué sirve" className="border-y border-[var(--line)] py-5">
        <div className="marquee">
          <div className="marquee-track">
            {[...occasions, ...occasions].map((label, i) => (
              <span
                key={i}
                className="chip px-4 py-1.5 text-sm"
                aria-hidden={i >= occasions.length}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <Reveal className="text-center">
          <p className="eyebrow">Cómo funciona</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Tres pasos. Cero discusiones en el grupo.
          </h2>
        </Reveal>
        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          <span
            className="absolute left-[16%] right-[16%] top-12 hidden h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent md:block"
            aria-hidden
          />
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 120}>
              <div className="surface relative h-full p-6 text-center">
                <span className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b1220] text-amber-300 ring-1 ring-amber-400/40">
                  {step.icon}
                </span>
                <p className="eyebrow mt-4">Paso {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features bento */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <Reveal className="text-center">
          <p className="eyebrow">Por qué Careff</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Pensado para que lo uses (y lo vuelvas a usar)
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <Feature
              icon={<RouteIcon className="h-6 w-6" />}
              title="Rutas reales, no línea recta"
              text="Medimos cada tramo por calle y probamos las combinaciones de autos hasta encontrar la que suma menos kilómetros para todo el grupo."
            >
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ['Sofi', '#fbbf24', '7,2 km · 2 paradas'],
                  ['Tomi', '#38bdf8', '5,9 km · 1 parada'],
                  ['Caro', '#34d399', '5,3 km · 2 paradas'],
                ].map(([name, color, detail]) => (
                  <span
                    key={name}
                    className="surface-inset flex items-center gap-2 px-3 py-2 text-xs"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                    <span className="font-semibold text-white">{name}</span>
                    <span className="text-[var(--ink-faint)]">{detail}</span>
                  </span>
                ))}
              </div>
            </Feature>
          </Reveal>
          <Reveal className="md:col-span-2" delay={100}>
            <Feature
              icon={<GiftIcon className="h-6 w-6" />}
              title="100% gratis"
              text='Sin tarjeta, sin límites, sin versión "pro". Gratis de verdad.'
            />
          </Reveal>
          <Reveal className="md:col-span-2">
            <Feature
              icon={<PinIcon className="h-6 w-6" />}
              title="Direcciones inteligentes"
              text="Autocompletado por provincia para que nada quede mal escrito ni caiga en otra ciudad."
            />
          </Reveal>
          <Reveal className="md:col-span-2" delay={100}>
            <Feature
              icon={<LinkIcon className="h-6 w-6" />}
              title="Planes compartibles"
              text="Cada plan guardado tiene un link público para mandar al grupo. Solo lectura."
            />
          </Reveal>
          <Reveal className="md:col-span-2" delay={200}>
            <Feature
              icon={<ShieldIcon className="h-6 w-6" />}
              title="Tus datos son tuyos"
              text="Solo guardamos lo que vos decidís guardar. Nada de publicidad."
            />
          </Reveal>
          <Reveal className="md:col-span-3">
            <Feature
              icon={<UsersIcon className="h-6 w-6" />}
              title="Grupos que se arman solos"
              text="Mandás un link y cada persona carga desde dónde sale y si lleva auto. Vos solo apretás calcular."
            />
          </Reveal>
          <Reveal className="md:col-span-3" delay={100}>
            <Feature
              icon={<WalletIcon className="h-6 w-6" />}
              title="La nafta, dividida"
              text="Estimamos el gasto de cada auto, sumás peajes y te decimos cuánto pone cada uno. Ida sola o ida y vuelta."
            />
          </Reveal>
        </div>
      </section>

      {/* Facts */}
      <section className="border-y border-[var(--line)] bg-white/[0.02]">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-4 py-12 text-center md:grid-cols-4">
          {facts.map(([big, label], i) => (
            <Reveal key={label} delay={i * 80}>
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="text-gradient block text-4xl font-bold tracking-tight sm:text-5xl">
                  {big}
                </span>
                <span className="mt-1 block text-sm text-[var(--ink-dim)]">{label}</span>
              </dd>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-24">
        <Reveal className="text-center">
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Lo que todos preguntan</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {faqs.map(([question, answer], i) => (
            <Reveal key={question} delay={i * 60}>
              <details className="surface group">
                <summary className="flex items-center justify-between gap-4 p-5 font-semibold text-white">
                  {question}
                  <ChevronDownIcon className="caret h-5 w-5 flex-none text-amber-300" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--ink-dim)]">{answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <Reveal>
          <div className="surface relative overflow-hidden px-6 py-14 text-center sm:px-12">
            <span
              className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-amber-500/20 blur-[90px]"
              aria-hidden
            />
            <h2 className="relative mx-auto max-w-2xl text-3xl font-bold text-white sm:text-4xl">
              El grupo ya tiene ganas de ir.{' '}
              <span className="text-gradient">Falta decidir quién maneja.</span>
            </h2>
            <Link
              href="/planner"
              className="btn-glow relative mt-8 inline-flex rounded-2xl px-8 py-3.5 text-base"
            >
              Armar mi primer viaje
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 py-8 text-sm text-[var(--ink-faint)] sm:flex-row">
          <Logo />
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/planner" className="link-sweep hover:text-white">
              Planificador
            </Link>
            <Link href="/register" className="link-sweep hover:text-white">
              Crear cuenta
            </Link>
            <Link href="/login" className="link-sweep hover:text-white">
              Iniciar sesión
            </Link>
          </nav>
          <p className="text-center">Hecho con datos abiertos de OpenStreetMap</p>
        </div>
      </footer>
    </div>
  );
}
