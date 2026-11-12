import { after } from 'next/server';
import pkg from '../package.json';

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  category: 'security' | 'api' | 'system';
  event: string;
  timestamp: string;
  [key: string]: unknown;
}

// Deploy correlation: the release the app is running. Prefers an explicit
// APP_RELEASE, then a CI-provided git SHA, falling back to the package version
// so events are always tagged even without extra config.
function appRelease(): string {
  return (
    process.env.APP_RELEASE ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_SHA ||
    pkg.version
  );
}

function formatError(error: unknown): unknown {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return String(error);
    }
  }
  return String(error);
}

// Optional centralized monitoring: when MISSION_CONTROL_URL and
// MISSION_CONTROL_API_KEY are set, warn/error entries are also shipped to the
// Mission Control dashboard. Fire-and-forget: monitoring must never break the app.
function deliver(entry: LogEntry): void {
  const url = process.env.MISSION_CONTROL_URL;
  const key = process.env.MISSION_CONTROL_API_KEY;
  if (!url || !key) return;
  void fetch(`${url.replace(/\/$/, '')}/api/ingest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify(entry),
    // keepalive lets the request outlive the response on most runtimes
    keepalive: true,
  }).catch(() => undefined);
}

function ship(entry: LogEntry): void {
  // after() defers delivery until the response is sent and keeps the serverless
  // instance alive until it completes — without it, error reports are dropped
  // whenever the platform freezes the instance right after responding. Outside a
  // request scope (scripts, boot) it throws: send direct.
  try {
    after(() => deliver(entry));
  } catch {
    deliver(entry);
  }
}

function log(entry: LogEntry): void {
  const output = JSON.stringify(entry);
  if (entry.level === 'error') console.error(output);
  else if (entry.level === 'warn') console.warn(output);
  else console.warn(output); // structured info also goes to stderr-safe channel
  if (entry.level === 'error' || entry.level === 'warn') ship(entry);
}

export function logApiError(path: string, method: string, error: unknown): void {
  log({
    level: 'error',
    category: 'api',
    event: 'api_error',
    timestamp: new Date().toISOString(),
    release: appRelease(),
    path,
    method,
    error: formatError(error),
  });
  // Hook Sentry here when a DSN is configured:
  // Sentry.captureException(error, { tags: { path, method } });
}

export function logSecurityEvent(event: string, details: Record<string, unknown> = {}): void {
  log({
    level: 'warn',
    category: 'security',
    event,
    timestamp: new Date().toISOString(),
    release: appRelease(),
    ...details,
  });
}
