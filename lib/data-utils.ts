import Database, { sql } from './interfaces/database.ts';
import { Event, User, UserSession, VerificationCode } from './types.ts';
import { generateRandomCode, splitArrayInChunks } from './utils.ts';

const db = new Database();

export const monthRegExp = new RegExp(/^\d{4}\-\d{2}$/);

export async function getUserByEmail(email: string) {
  const lowercaseEmail = email.toLowerCase().trim();

  const user = (await db.query<User>(sql`SELECT * FROM "loggit_users" WHERE "email" = $1 LIMIT 1`, [
    lowercaseEmail,
  ]))[0];

  return user;
}

export async function getUserById(id: string) {
  const user = (await db.query<User>(sql`SELECT * FROM "loggit_users" WHERE "id" = $1 LIMIT 1`, [
    id,
  ]))[0];

  return user;
}

export async function createUser(email: User['email'], encryptedKeyPair: User['encrypted_key_pair']) {
  const trialDays = 30;
  const now = new Date();
  const trialEndDate = new Date(new Date().setUTCDate(new Date().getUTCDate() + trialDays));

  const subscription: User['subscription'] = {
    external: {},
    expires_at: trialEndDate.toISOString(),
    updated_at: now.toISOString(),
  };

  const newUser = (await db.query<User>(
    sql`INSERT INTO "loggit_users" (
      "email",
      "subscription",
      "status",
      "encrypted_key_pair",
      "extra"
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      email,
      JSON.stringify(subscription),
      'trial',
      encryptedKeyPair,
      JSON.stringify({}),
    ],
  ))[0];

  return newUser;
}

export async function updateUser(user: User) {
  await db.query(
    sql`UPDATE "loggit_users" SET
        "email" = $2,
        "subscription" = $3,
        "status" = $4,
        "encrypted_key_pair" = $5,
        "extra" = $6
      WHERE "id" = $1`,
    [
      user.id,
      user.email,
      JSON.stringify(user.subscription),
      user.status,
      user.encrypted_key_pair,
      JSON.stringify(user.extra),
    ],
  );
}

export async function deleteUser(userId: string) {
  await db.query(
    sql`DELETE FROM "loggit_user_sessions" WHERE "user_id" = $1`,
    [
      userId,
    ],
  );

  await db.query(
    sql`DELETE FROM "loggit_verification_codes" WHERE "user_id" = $1`,
    [
      userId,
    ],
  );

  await db.query(
    sql`DELETE FROM "loggit_events" WHERE "user_id" = $1`,
    [
      userId,
    ],
  );

  await db.query(
    sql`DELETE FROM "loggit_users" WHERE "id" = $1`,
    [
      userId,
    ],
  );
}

export async function getSessionById(id: string) {
  const session = (await db.query<UserSession>(
    sql`SELECT * FROM "loggit_user_sessions" WHERE "id" = $1 AND "expires_at" > now() LIMIT 1`,
    [
      id,
    ],
  ))[0];

  return session;
}

export async function createSession(user: User, isNewUser = false) {
  // Add new user session to the db
  const oneMonthFromToday = new Date(new Date().setUTCMonth(new Date().getUTCMonth() + 1));

  const newSession: Omit<UserSession, 'id' | 'created_at'> = {
    user_id: user.id,
    expires_at: oneMonthFromToday,
    last_seen_at: new Date(),
    verified: isNewUser,
  };

  const newUserSessionResult = (await db.query<UserSession>(
    sql`INSERT INTO "loggit_user_sessions" (
      "user_id",
      "expires_at",
      "verified",
      "last_seen_at"
    ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
    [
      newSession.user_id,
      newSession.expires_at,
      newSession.verified,
      newSession.last_seen_at,
    ],
  ))[0];

  return newUserSessionResult;
}

export async function updateSession(session: UserSession) {
  await db.query(
    sql`UPDATE "loggit_user_sessions" SET
        "expires_at" = $2,
        "verified" = $3,
        "last_seen_at" = $4
      WHERE "id" = $1`,
    [
      session.id,
      session.expires_at,
      session.verified,
      session.last_seen_at,
    ],
  );
}

export async function validateUserAndSession(userId: string, sessionId: string, acceptUnverifiedSession = false) {
  const user = await getUserById(userId);

  if (!user) {
    throw new Error('Not Found');
  }

  const session = await getSessionById(sessionId);

  if (!session || session.user_id !== user.id || (!session.verified && !acceptUnverifiedSession)) {
    throw new Error('Not Found');
  }

  const oneMonthFromToday = new Date(new Date().setUTCMonth(new Date().getUTCMonth() + 1));

  session.last_seen_at = new Date();
  session.expires_at = oneMonthFromToday;

  await updateSession(session);

  return { user, session };
}

export async function createVerificationCode(
  user: User,
  session: UserSession,
  type: VerificationCode['verification']['type'],
) {
  const inThirtyMinutes = new Date(new Date().setUTCMinutes(new Date().getUTCMinutes() + 30));

  const code = generateRandomCode();

  const newVerificationCode: Omit<VerificationCode, 'id' | 'created_at'> = {
    user_id: user.id,
    code,
    expires_at: inThirtyMinutes,
    verification: {
      id: session.id,
      type,
    },
  };

  await db.query(
    sql`INSERT INTO "loggit_verification_codes" (
      "user_id",
      "code",
      "expires_at",
      "verification"
    ) VALUES ($1, $2, $3, $4)
      RETURNING "id"`,
    [
      newVerificationCode.user_id,
      newVerificationCode.code,
      newVerificationCode.expires_at,
      JSON.stringify(newVerificationCode.verification),
    ],
  );

  return code;
}

export async function validateVerificationCode(
  user: User,
  session: UserSession,
  code: string,
  type: VerificationCode['verification']['type'],
) {
  const verificationCode = (await db.query<VerificationCode>(
    sql`SELECT * FROM "loggit_verification_codes"
      WHERE "user_id" = $1 AND
        "code" = $2 AND
        "verification" ->> 'type' = $3 AND
        "verification" ->> 'id' = $4 AND 
        "expires_at" > now()
      LIMIT 1`,
    [
      user.id,
      code,
      type,
      session.id,
    ],
  ))[0];

  if (verificationCode) {
    await db.query(
      sql`DELETE FROM "loggit_verification_codes" WHERE "id" = $1`,
      [
        verificationCode.id,
      ],
    );
  } else {
    throw new Error('Not Found');
  }
}

export async function getAllEvents(userId: string) {
  const events = await db.query<Event>(
    sql`SELECT * FROM "loggit_events"
      WHERE "user_id" = $1
      ORDER BY "date" DESC`,
    [
      userId,
    ],
  );

  return events;
}

export async function getEventsByMonth(userId: string, month: string) {
  const events = await db.query<Event>(
    sql`SELECT * FROM "loggit_events"
      WHERE "user_id" = $1 AND
        "date" >= '${month}-01' AND
        "date" <= '${month}-31'
      ORDER BY "date" DESC`,
    [
      userId,
    ],
  );

  return events;
}

export async function createEvent(event: Omit<Event, 'id'>) {
  const newEvent = (await db.query<Event>(
    sql`INSERT INTO "loggit_events" (
      "user_id",
      "name",
      "date",
      "extra"
    ) VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [
      event.user_id,
      event.name,
      event.date,
      JSON.stringify(event.extra),
    ],
  ))[0];

  return newEvent;
}

export async function updateEvent(event: Event) {
  await db.query(
    sql`UPDATE "loggit_events" SET
        "name" = $2,
        "date" = $3,
        "extra" = $4
      WHERE "id" = $1`,
    [
      event.id,
      event.name,
      event.date,
      JSON.stringify(event.extra),
    ],
  );
}

export async function deleteEvent(eventId: string) {
  await db.query(
    sql`DELETE FROM "loggit_events" WHERE "id" = $1`,
    [
      eventId,
    ],
  );
}

export async function deleteAllEvents(userId: string) {
  await db.query(
    sql`DELETE FROM "loggit_events" WHERE "user_id" = $1`,
    [
      userId,
    ],
  );
}

export async function importUserData(userId: string, events: Omit<Event, 'id' | 'user_id'>[]) {
  const addEventChunks = splitArrayInChunks(
    events,
    100, // import in transactions of 100 events each
  );

  for (const eventsToAdd of addEventChunks) {
    await db.query(sql`BEGIN;`);

    for (const event of eventsToAdd) {
      await createEvent({ ...event, user_id: userId });
    }

    await db.query(sql`COMMIT;`);
  }
}
