import 'std/dotenv/load.ts';

import { helpEmail } from '/lib/utils.ts';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || '';

enum BrevoTemplateId {
  LOGGIT_VERIFY_LOGIN = 3,
  LOGGIT_VERIFY_UPDATE = 4,
  LOGGIT_VERIFY_DELETE = 5,
  LOGGIT_UPDATE_BILLING_EMAIL = 6,
  LOGGIT_SUBSCRIPTION_EXPIRED = 7,
}

interface BrevoResponse {
  messageId?: string;
  code?: string;
  message?: string;
}

function getApiRequestHeaders() {
  return {
    'Api-Key': BREVO_API_KEY,
    'Accept': 'application/json; charset=utf-8',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

interface BrevoRequestBody {
  templateId?: number;
  params: Record<string, any>;
  to: { email: string; name?: string }[];
  cc?: { email: string; name?: string }[];
  bcc?: { email: string; name?: string }[];
  htmlContent?: string;
  textContent?: string;
  subject?: string;
  replyTo: { email: string; name?: string };
  tags?: string[];
  attachment?: { name: string; content: string; url: string }[];
}

async function sendEmailWithTemplate(
  to: string,
  templateId: BrevoTemplateId,
  data: BrevoRequestBody['params'],
  attachments: BrevoRequestBody['attachment'] = [],
  cc?: string,
) {
  const email: BrevoRequestBody = {
    templateId,
    params: data,
    to: [{ email: to }],
    replyTo: { email: helpEmail },
  };

  if (attachments?.length) {
    email.attachment = attachments;
  }

  if (cc) {
    email.cc = [{ email: cc }];
  }

  const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: getApiRequestHeaders(),
    body: JSON.stringify(email),
  });
  const brevoResult = (await brevoResponse.json()) as BrevoResponse;

  if (brevoResult.code || brevoResult.message) {
    console.log(JSON.stringify({ brevoResult }, null, 2));
    throw new Error(`Failed to send email "${templateId}"`);
  }
}

export async function sendVerifyLoginEmail(
  email: string,
  verificationCode: string,
) {
  const data = {
    verificationCode,
  };

  await sendEmailWithTemplate(email, BrevoTemplateId.LOGGIT_VERIFY_LOGIN, data);
}

export async function sendVerifyDeleteDataEmail(
  email: string,
  verificationCode: string,
) {
  const data = {
    verificationCode,
    deletionSubject: 'all your data',
  };

  await sendEmailWithTemplate(email, BrevoTemplateId.LOGGIT_VERIFY_DELETE, data);
}

export async function sendVerifyDeleteAccountEmail(
  email: string,
  verificationCode: string,
) {
  const data = {
    verificationCode,
    deletionSubject: 'your account',
  };

  await sendEmailWithTemplate(email, BrevoTemplateId.LOGGIT_VERIFY_DELETE, data);
}

export async function sendVerifyUpdateEmailEmail(
  email: string,
  verificationCode: string,
) {
  const data = {
    verificationCode,
    updateSubject: 'your email',
  };

  await sendEmailWithTemplate(email, BrevoTemplateId.LOGGIT_VERIFY_UPDATE, data);
}

export async function sendVerifyUpdatePasswordEmail(
  email: string,
  verificationCode: string,
) {
  const data = {
    verificationCode,
    updateSubject: 'your password',
  };

  await sendEmailWithTemplate(email, BrevoTemplateId.LOGGIT_VERIFY_UPDATE, data);
}

export async function sendUpdateEmailInProviderEmail(
  oldEmail: string,
  newEmail: string,
) {
  const data = {
    oldEmail,
    newEmail,
  };

  await sendEmailWithTemplate(helpEmail, BrevoTemplateId.LOGGIT_UPDATE_BILLING_EMAIL, data);
}

export async function sendSubscriptionExpiredEmail(
  email: string,
) {
  await sendEmailWithTemplate(email, BrevoTemplateId.LOGGIT_SUBSCRIPTION_EXPIRED, {});
}
