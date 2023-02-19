import { updateUser, validateUserAndSession } from '/lib/data-utils.ts';
import { getSubscribedUsers } from '/lib/providers/paddle.ts';
import { PADDLE_MONTHLY_PLAN_ID } from '/lib/utils.ts';

export async function pageAction(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Not Implemented', { status: 501 });
  }

  const { session_id, user_id }: { session_id: string; user_id: string } = await request.json();

  if (!session_id || !user_id) {
    return new Response('Bad Request', { status: 400 });
  }

  const { user } = await validateUserAndSession(user_id, session_id);

  const subscribedUsers = await getSubscribedUsers();

  const subscribedUser = subscribedUsers.find((paddleUser) => paddleUser.user_email === user.email);

  if (subscribedUser) {
    user.subscription.isMonthly = subscribedUser.plan_id === PADDLE_MONTHLY_PLAN_ID;
    user.subscription.updated_at = new Date().toISOString();
    user.subscription.expires_at = new Date(subscribedUser.next_payment.date).toISOString();
    user.subscription.external.paddle = {
      user_id: subscribedUser.user_id.toString(),
      subscription_id: subscribedUser.subscription_id.toString(),
      update_url: subscribedUser.update_url,
      cancel_url: subscribedUser.cancel_url,
    };
    user.status = 'active';

    await updateUser(user);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function pageContent() {
  return new Response('Not Implemented', { status: 501 });
}
