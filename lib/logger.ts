type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  category: 'security' | 'api' | 'system';
  event: string;
  timestamp: string;
  [key: string]: unknown;
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

function log(entry: LogEntry): void {
  const output = JSON.stringify(entry);
  if (entry.level === 'error') console.error(output);
  else if (entry.level === 'warn') console.warn(output);
  else console.warn(output); // structured info also goes to stderr-safe channel
}

export function logApiError(path: string, method: string, error: unknown): void {
  log({
    level: 'error',
    category: 'api',
    event: 'api_error',
    timestamp: new Date().toISOString(),
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
    ...details,
  });
}
