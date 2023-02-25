import { updateUser, validateUserAndSession } from '/lib/data-utils.ts';
import { getSubscriptions as getStripeSubscriptions } from '/lib/providers/stripe.ts';
// import { getSubscriptions as getPaypalSubscriptions } from '/lib/providers/paypal.ts';
import { sendUpdateEmailInProviderEmail } from '/lib/providers/postmark.ts';

export async function pageAction(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Not Implemented', { status: 501 });
  }

  const { session_id, user_id, provider }: { session_id: string; user_id: string; provider: 'paypal' | 'stripe' } =
    await request.json();

  if (!session_id || !user_id) {
    return new Response('Bad Request', { status: 400 });
  }

  const { user } = await validateUserAndSession(user_id, session_id);

  if (provider === 'stripe') {
    const subscriptions = await getStripeSubscriptions();

    const subscription = subscriptions.find((subscription) =>
      subscription.customer.email === user.email &&
      subscription.items.data.some((item) => item.price.id.startsWith('loggit-'))
    );

    if (subscription) {
      user.subscription.isMonthly = subscription.items.data.some((item) => item.price.id.includes('monthly'));
      user.subscription.updated_at = new Date().toISOString();
      user.subscription.expires_at = new Date(subscription.current_period_end * 1000).toISOString();
      user.subscription.external.stripe = {
        user_id: subscription.customer.id,
        subscription_id: subscription.id,
      };
      user.status = 'active';

      await updateUser(user);
    }
  } else if (provider === 'paypal') {
    // NOTE: "Hack" for manually updating/verifying until PayPal builds a subscriptions list API
    await sendUpdateEmailInProviderEmail(user.email, user.email);
    //   const subscriptions = await getPaypalSubscriptions();

    //   const subscription = subscriptions.find((subscription) => subscription.subscriber.email_address === user.email);

    //   if (subscription) {
    //     user.subscription.isMonthly = parseInt(subscription.billing_info.last_payment.amount.value, 10) < 10;
    //     user.subscription.updated_at = new Date().toISOString();
    //     user.subscription.expires_at = new Date(subscription.billing_info.next_billing_time).toISOString();
    //     user.subscription.external.stripe = {
    //       user_id: subscription.subscriber.payer_id,
    //       subscription_id: subscription.id,
    //     };
    user.status = 'active';

    await updateUser(user);
    //  }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function pageContent() {
  return new Response('Not Implemented', { status: 501 });
}
