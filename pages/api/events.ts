import {
  createEvent,
  deleteEvent,
  getAllEvents,
  getEventsByMonth,
  monthRegExp,
  updateEvent,
  validateUserAndSession,
} from '/lib/data-utils.ts';
import { Event } from '/lib/types.ts';

async function createOrUpdateEvent(request: Request) {
  const { session_id, user_id, name, date, extra, id }: Omit<Event, 'id'> & { session_id: string; id?: string } =
    await request.json();

  if (!session_id || !user_id || !name || !date || !extra) {
    return new Response('Bad Request', { status: 400 });
  }

  if ((request.method === 'PATCH' && !id) || (request.method === 'POST' && id)) {
    return new Response('Bad Request', { status: 400 });
  }

  await validateUserAndSession(user_id, session_id);

  if (request.method === 'PATCH') {
    await updateEvent({ id: id!, user_id, name, date, extra });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const newEvent = await createEvent({
    user_id,
    name,
    date,
    extra,
  });

  return new Response(JSON.stringify(newEvent), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

async function deleteEventAction(request: Request) {
  const { user_id, session_id, id }: { user_id: string; session_id: string; id: string } = await request.json();

  if (!user_id || !session_id || !id) {
    return new Response('Bad Request', { status: 400 });
  }

  await validateUserAndSession(user_id, session_id);

  await deleteEvent(id);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function pageAction(request: Request) {
  switch (request.method) {
    case 'POST':
    case 'PATCH':
      return createOrUpdateEvent(request);
    case 'DELETE':
      return deleteEventAction(request);
  }

  return new Response('Not Implemented', { status: 501 });
}

export async function pageContent(request: Request, _match: URLPatternResult) {
  const urlSearchParams = new URL(request.url).searchParams;
  const sessionId = urlSearchParams.get('session_id');
  const userId = urlSearchParams.get('user_id');
  const month = urlSearchParams.get('month');

  if (!sessionId || !userId || !month || (!monthRegExp.test(month) && month !== 'all')) {
    return new Response('Bad Request', { status: 400 });
  }

  const { user } = await validateUserAndSession(userId, sessionId);

  const events = await (month === 'all' ? getAllEvents(user.id) : getEventsByMonth(user.id, month));

  return new Response(JSON.stringify(events), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
