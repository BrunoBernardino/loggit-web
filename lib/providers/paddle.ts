import 'std/dotenv/load.ts';

import { PADDLE_VENDOR_ID } from '/lib/utils.ts';

const PADDLE_API_KEY = Deno.env.get('PADDLE_API_KEY') || '';

interface PaddleUser {
  subscription_id: number;
  plan_id: number;
  user_id: number;
  user_email: string;
  state: 'active' | 'trialing' | 'paused' | 'deleted' | 'past_due';
  signup_date: string;
  next_payment: {
    amount: number;
    currency: string;
    date: string;
  };
  update_url: string;
  cancel_url: string;
}

interface PaddleResponse {
  success: boolean;
  error?: {
    code: number;
    message: string;
  };
  response?: PaddleUser[];
}

function getApiRequestHeaders() {
  return {
    'Accept': 'application/json; charset=utf-8',
    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
  };
}

export async function getSubscribedUsers(paddlePlanId?: string) {
  const body: { vendor_id: string; vendor_auth_code: string; results_per_page: string; plan_id?: string } = {
    vendor_id: PADDLE_VENDOR_ID,
    vendor_auth_code: PADDLE_API_KEY,
    results_per_page: '100',
  };

  if (paddlePlanId) {
    body.plan_id = paddlePlanId;
  }

  // const response = await fetch('https://sandbox-vendors.paddle.com/api/2.0/subscription/users', { // Sandbox
  const response = await fetch('https://vendors.paddle.com/api/2.0/subscription/users', { // Production
    method: 'POST',
    headers: getApiRequestHeaders(),
    body: new URLSearchParams(Object.entries(body)).toString(),
  });

  const result = (await response.json()) as PaddleResponse;

  if (!result.success || !result.response) {
    console.log(JSON.stringify({ result }, null, 2));
    throw new Error(`Failed to make API request: "${result}"`);
  }

  return result.response!;
}
