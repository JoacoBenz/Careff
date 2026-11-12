import { env } from './env';
import { sendEmail } from './email';
import { issueAuthToken } from './auth-tokens';

/** Emails tied to the account lifecycle. Each issues its own single-use link. */

interface Recipient {
  id: number;
  email: string;
  name: string;
}

function appUrl(): string {
  return (env.NEXT_PUBLIC_APP_URL ?? env.NEXTAUTH_URL).replace(/\/+$/, '');
}

export async function sendVerificationEmail(user: Recipient): Promise<void> {
  const token = await issueAuthToken(user.id, 'EMAIL_VERIFY');
  await sendEmail({
    to: user.email,
    subject: 'Confirmá tu email en Careff',
    text: `Hola ${user.name}:\n\nConfirmá que este email es tuyo para proteger tu cuenta de Careff. El link vence en 24 horas.\n\nSi no creaste una cuenta, ignorá este mensaje.`,
    action: {
      label: 'Confirmar mi email',
      url: `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`,
    },
  });
}

export async function sendPasswordResetEmail(user: Recipient): Promise<void> {
  const token = await issueAuthToken(user.id, 'PASSWORD_RESET');
  await sendEmail({
    to: user.email,
    subject: 'Elegí una nueva contraseña para Careff',
    text: `Hola ${user.name}:\n\nRecibimos un pedido para cambiar la contraseña de tu cuenta de Careff. El link vence en 1 hora y sirve una sola vez.\n\nSi no fuiste vos, ignorá este mensaje: tu contraseña sigue igual.`,
    action: {
      label: 'Elegir nueva contraseña',
      url: `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`,
    },
  });
}
