import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mutable stand-in for lib/env so each case can pick its configuration.
const env = vi.hoisted(() => ({
  RESEND_API_KEY: undefined as string | undefined,
  EMAIL_FROM: 'Careff <test@careff.test>',
  NODE_ENV: 'test' as string,
}));
vi.mock('@/lib/env', () => ({ env }));

import { renderEmailHtml, sendEmail } from '@/lib/email';

const message = {
  to: 'ana@example.com',
  subject: 'Hola',
  text: 'Primera línea\n\nSegunda <b>línea</b>',
  action: { label: 'Abrir', url: 'https://careff.test/x?token=a&b=1' },
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  env.RESEND_API_KEY = undefined;
  env.NODE_ENV = 'test';
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('renderEmailHtml', () => {
  it('escapes user-controlled text and the link', () => {
    const html = renderEmailHtml(message);
    expect(html).toContain('Segunda &lt;b&gt;línea&lt;/b&gt;');
    expect(html).not.toContain('<b>línea</b>');
    expect(html).toContain('href="https://careff.test/x?token=a&amp;b=1"');
  });
});

describe('sendEmail', () => {
  it('logs instead of sending when no key is set outside production', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await sendEmail(message);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain(message.action.url);
  });

  it('throws when no key is set in production', async () => {
    env.NODE_ENV = 'production';
    await expect(sendEmail(message)).rejects.toThrow(/RESEND_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts to Resend with the key, sender and both bodies', async () => {
    env.RESEND_API_KEY = 're_test';
    fetchMock.mockResolvedValue(new Response('{"id":"1"}', { status: 200 }));
    await sendEmail(message);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_test');
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.from).toBe('Careff <test@careff.test>');
    expect(body.to).toEqual(['ana@example.com']);
    expect(body.subject).toBe('Hola');
    expect(String(body.text)).toContain('Abrir: https://careff.test/x?token=a&b=1');
    expect(String(body.html)).toContain('Abrir');
  });

  it('throws with the status when Resend rejects the request', async () => {
    env.RESEND_API_KEY = 're_test';
    fetchMock.mockResolvedValue(new Response('domain not verified', { status: 403 }));
    await expect(sendEmail(message)).rejects.toThrow(/403.*domain not verified/);
  });
});
