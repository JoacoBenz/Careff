import type { ReactNode } from 'react';

/** Standard page heading for the logged-in area: eyebrow, title, blurb, action. */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="rise mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-white">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm text-[var(--ink-dim)]">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}
