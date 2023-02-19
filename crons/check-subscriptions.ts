import Database, { sql } from '/lib/interfaces/database.ts';
import { getSubscribedUsers } from '/lib/providers/paddle.ts';
import { updateUser } from '/lib/data-utils.ts';
import { User } from '/lib/types.ts';
import { PADDLE_MONTHLY_PLAN_ID } from '/lib/utils.ts';

const db = new Database();

async function checkSubscriptions() {
  try {
    const users = await db.query<User>(
      sql`SELECT * FROM "loggit_users" WHERE "status" IN ('active', 'trial')`,
    );

    let updatedUsers = 0;

    const paddleUsers = await getSubscribedUsers();

    for (const paddleUser of paddleUsers) {
      const matchingUser = users.find((user) => user.email === paddleUser.user_email);

      if (matchingUser) {
        if (!matchingUser.subscription.external.paddle) {
          matchingUser.subscription.external.paddle = {
            user_id: paddleUser.user_id.toString(),
            subscription_id: paddleUser.subscription_id.toString(),
            update_url: paddleUser.update_url,
            cancel_url: paddleUser.cancel_url,
          };
        }

        matchingUser.subscription.isMonthly = paddleUser.plan_id === PADDLE_MONTHLY_PLAN_ID;
        matchingUser.subscription.updated_at = new Date().toISOString();
        matchingUser.subscription.expires_at = new Date(paddleUser.next_payment.date).toISOString();

        if (['active', 'paused'].includes(paddleUser.state)) {
          matchingUser.status = 'active';
        } else if (paddleUser.state === 'trialing') {
          matchingUser.status = 'trial';
        } else {
          matchingUser.status = 'inactive';
        }

        await updateUser(matchingUser);

        ++updatedUsers;
      }
    }

    console.log('Updated', updatedUsers, 'users');
  } catch (error) {
    console.log(error);
  }
}

await checkSubscriptions();
