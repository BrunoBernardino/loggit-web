import { Event, KeyPair, User } from '/lib/types.ts';
import Encryption from './encryption.ts';
import LocalData, { StoredSession } from './local-data.ts';

declare global {
  interface Window {
    app: App;
    Swal: any;
  }
}

export interface App {
  STRIPE_MONTHLY_URL: string;
  STRIPE_YEARLY_URL: string;
  STRIPE_CUSTOMER_URL: string;
  PAYPAL_MONTHLY_URL: string;
  PAYPAL_YEARLY_URL: string;
  PAYPAL_CUSTOMER_URL: string;
  isLoggedIn: boolean;
  showLoading: () => void;
  hideLoading: () => void;
  doLogout?: () => void;
}

export function showValidSessionElements() {
  const elementsToShow = document.querySelectorAll('[data-has-valid-session]');
  const elementsToHide = document.querySelectorAll('[data-has-invalid-session]');

  elementsToShow.forEach((element) => element.classList.remove('hidden'));
  elementsToHide.forEach((element) => element.classList.add('hidden'));
}

export function hideValidSessionElements() {
  const elementsToShow = document.querySelectorAll('[data-has-invalid-session]');
  const elementsToHide = document.querySelectorAll('[data-has-valid-session]');

  elementsToShow.forEach((element) => element.classList.remove('hidden'));
  elementsToHide.forEach((element) => element.classList.add('hidden'));
}

export async function checkForValidSession() {
  const isUserLoggedIn = isLoggedIn();

  if (isUserLoggedIn) {
    window.app.isLoggedIn = true;
    showValidSessionElements();

    const user = await getUser();

    if (user?.status === 'inactive') {
      showNotification('Your trial has expired!', 'error');

      // Give people some time to logout or export
      setTimeout(() => {
        window.location.href = '/pricing';
      }, 10000);
    }

    return user;
  }
}

export function showNotification(message: string, type = 'success') {
  const { Swal } = window;

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: type === 'success' ? 2500 : 0,
    timerProgressBar: type === 'success',
    didOpen: (toast: any) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: type,
    title: message,
  });
}

export function doLogout() {
  const { Swal } = window;

  try {
    LocalData.clear();
    hideValidSessionElements();

    Swal.fire('Alright!', 'No idea who you are right now.', 'success');
    return true;
  } catch (error) {
    Swal.fire(
      'Something went wrong!',
      `Uh oh! Something wrong happened: ${error && error.message}`,
      'error',
    );
  }

  return false;
}

if (window.app && !window.app.doLogout) {
  window.app.doLogout = doLogout;
}

export function isLoggedIn() {
  try {
    const session = LocalData.get('session');
    if (session) {
      return true;
    }
  } catch (_error) {
    // Do nothing
  }

  return false;
}

let cachedCryptoKey: CryptoKey;

async function getCryptoKey(keyPair: KeyPair) {
  if (cachedCryptoKey) {
    return cachedCryptoKey;
  }

  const decryptionKey = await Encryption.deriveKey(keyPair.publicKeyJwk, keyPair.privateKeyJwk);

  cachedCryptoKey = decryptionKey;

  return decryptionKey;
}

export const commonRequestHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Accept': 'application/json; charset=utf-8',
};

async function getUser() {
  try {
    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const searchParams = new URLSearchParams();

    searchParams.set('session_id', session.sessionId);
    searchParams.set('user_id', session.userId);
    searchParams.set('email', session.email);

    const response = await fetch(`/api/user?${searchParams.toString()}`, { method: 'GET', headers });
    const user = (await response.json()) as User;

    return user;
  } catch (_error) {
    // Do nothing
  }

  LocalData.clear();

  return null;
}

export async function validateLogin(email: string, password: string) {
  const { Swal } = window;

  try {
    const headers = commonRequestHeaders;

    const passwordKey = await Encryption.getAuthKey(password);

    const lowercaseEmail = (email || '').toLocaleLowerCase().trim();

    const body: { email: string } = {
      email: lowercaseEmail,
    };

    const response = await fetch('/api/session', { method: 'POST', headers, body: JSON.stringify(body) });
    const { user, session_id: sessionId } = (await response.json()) as { user: User; session_id: string };

    if (!user) {
      throw new Error('Failed email/password combination.');
    }

    let keyPair: KeyPair;

    try {
      keyPair = JSON.parse(await Encryption.decrypt(user.encrypted_key_pair, passwordKey));
    } catch (error) {
      console.log(error);
      await fetch('/api/session', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ user_id: user.id, session_id: sessionId }),
      });
      throw new Error('Failed email/password combination.');
    }

    window.app.hideLoading();

    const { value: code } = await Swal.fire({
      template: '#verification-code-modal',
      focusConfirm: false,
      allowEscapeKey: true,
      preConfirm: () => {
        const codeValue = (document.getElementById('verification-code-input') as HTMLInputElement).value;

        if (!codeValue) {
          showNotification('You need to submit a code!', 'error');
          return false;
        }

        return codeValue;
      },
      willOpen: () => {
        (document.getElementById('verification-code-input') as HTMLInputElement).value = '';
      },
    });

    window.app.showLoading();

    const verificationBody: { user_id: string; session_id: string; code: string } = {
      user_id: user.id,
      session_id: sessionId,
      code,
    };

    await fetch('/api/session', { method: 'PATCH', headers, body: JSON.stringify(verificationBody) });

    const session: StoredSession = {
      sessionId,
      userId: user.id,
      email: lowercaseEmail,
      keyPair,
    };

    LocalData.set('session', session);

    checkForValidSession();

    return { success: true };
  } catch (error) {
    console.log(error);

    LocalData.clear();

    return { success: false, error };
  }
}

export async function createAccount(email: string, password: string) {
  try {
    const headers = commonRequestHeaders;

    const passwordKey = await Encryption.getAuthKey(password);
    const keyPair = await Encryption.generateKeyPair();
    const encryptedKeyPair = await Encryption.encrypt(JSON.stringify(keyPair), passwordKey);

    const lowercaseEmail = (email || '').toLocaleLowerCase().trim();

    const body: { email: string; encrypted_key_pair: string } = {
      email: lowercaseEmail,
      encrypted_key_pair: encryptedKeyPair,
    };

    const response = await fetch('/api/user', { method: 'POST', headers, body: JSON.stringify(body) });
    const { user, session_id: sessionId } = (await response.json()) as { user: User; session_id: string };

    if (!user) {
      throw new Error('Failed to create user. Try logging in instead.');
    }

    const session: StoredSession = {
      sessionId,
      userId: user.id,
      email: lowercaseEmail,
      keyPair,
    };

    LocalData.set('session', session);

    checkForValidSession();

    return { success: true };
  } catch (error) {
    console.log(error);

    LocalData.clear();

    return { success: false, error };
  }
}

export async function fetchEvents(month: string) {
  try {
    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const searchParams = new URLSearchParams();
    searchParams.set('session_id', session.sessionId);
    searchParams.set('user_id', session.userId);
    searchParams.set('month', month);

    const response = await fetch(`/api/events?${searchParams.toString()}`, { method: 'GET', headers });
    const events = (await response.json()) as Event[];

    if (!events) {
      throw new Error('Failed to fetch events');
    }

    const cryptoKey = await getCryptoKey(session.keyPair);

    for (const event of events) {
      event.name = await Encryption.decrypt(event.name, cryptoKey);
    }

    return events;
  } catch (error) {
    const { Swal } = window;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong fetching events.',
    });

    console.error(error);
  }

  return [];
}

export async function saveEvent(event: Omit<Pick<Event, 'name' | 'date'>, 'id'> & { id?: string }) {
  try {
    if (event.name.trim().length === 0) {
      showNotification('The event needs a valid name.', 'error');
      return false;
    }

    if (!isValidDate(event.date)) {
      event.date = new Date().toISOString().substring(0, 10);
    }

    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const cryptoKey = await getCryptoKey(session.keyPair);

    const body: Omit<Event, 'id'> & { session_id: string; id?: string } = {
      session_id: session.sessionId,
      user_id: session.userId,
      name: await Encryption.encrypt(event.name, cryptoKey),
      date: event.date,
      extra: {},
    };

    if (event.id !== 'newEvent') {
      body.id = event.id;
    }

    await fetch('/api/events', { method: body.id ? 'PATCH' : 'POST', headers, body: JSON.stringify(body) });

    return true;
  } catch (error) {
    const { Swal } = window;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong saving that event.',
    });

    console.error(error);
  }

  return false;
}

export async function deleteEvent(eventId: string) {
  try {
    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const body: { session_id: string; user_id: string; id: string } = {
      session_id: session.sessionId,
      user_id: session.userId,
      id: eventId,
    };

    await fetch('/api/events', { method: 'DELETE', headers, body: JSON.stringify(body) });

    return true;
  } catch (error) {
    const { Swal } = window;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong deleting that event.',
    });

    console.error(error);
  }

  return false;
}

export async function deleteAllData() {
  const { Swal } = window;
  try {
    window.app.showLoading();

    const headers = commonRequestHeaders;

    const session = LocalData.get('session')!;

    const body: { user_id: string; session_id: string; code?: string } = {
      user_id: session.userId,
      session_id: session.sessionId,
    };

    await fetch('/api/data', { method: 'DELETE', headers, body: JSON.stringify(body) });

    window.app.hideLoading();

    const { value: code } = await Swal.fire({
      template: '#verification-code-modal',
      focusConfirm: false,
      allowEscapeKey: true,
      preConfirm: () => {
        const codeValue = (document.getElementById('verification-code-input') as HTMLInputElement).value;

        if (!codeValue) {
          showNotification('You need to submit a code!', 'error');
          return false;
        }

        return codeValue;
      },
      willOpen: () => {
        (document.getElementById('verification-code-input') as HTMLInputElement).value = '';
      },
    });

    window.app.showLoading();

    body.code = code;

    await fetch('/api/data', { method: 'DELETE', headers, body: JSON.stringify(body) });

    return true;
  } catch (error) {
    const { Swal } = window;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong deleting all data.',
    });

    console.error(error);
  }

  return false;
}

export async function exportAllData() {
  try {
    const events: (Omit<Event, 'user_id'> & { user_id?: string })[] = await fetchEvents('all');

    if (!events) {
      throw new Error('Failed to fetch events');
    }

    for (const event of events) {
      delete event.user_id;
    }

    return { events };
  } catch (error) {
    const { Swal } = window;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong exporting data.',
    });

    console.error(error);
  }

  return {};
}

export async function importData(replaceData: boolean, events: Event[]) {
  try {
    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const cryptoKey = await getCryptoKey(session.keyPair);

    if (replaceData) {
      await deleteAllData();
    }

    const finalEventsToAdd: Omit<Event, 'id' | 'user_id'>[] = [];

    for (const event of events) {
      const newEvent: typeof finalEventsToAdd[0] = {
        name: await Encryption.encrypt(event.name, cryptoKey),
        date: event.date,
        extra: {},
      };

      finalEventsToAdd.push(newEvent);
    }

    const body: { session_id: string; user_id: string; events: typeof finalEventsToAdd } = {
      session_id: session.sessionId,
      user_id: session.userId,
      events: finalEventsToAdd,
    };

    await fetch('/api/data', { method: 'POST', headers, body: JSON.stringify(body) });

    return true;
  } catch (error) {
    const { Swal } = window;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong importing data.',
    });

    console.error(error);
  }

  return false;
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface ShowFormattedDateOptions {
  showDay?: boolean;
  showYear?: boolean;
  longMonth?: boolean;
  longYear?: boolean;
}

export function showFormattedDate(
  stringDate: string,
  { showDay = true, showYear = false, longMonth = false, longYear = false }: ShowFormattedDateOptions = {},
) {
  const dateYear = parseInt(stringDate.substring(0, 4));
  const dateMonth = parseInt(stringDate.substring(5, 7), 10) - 1;
  const dateDay = parseInt(stringDate.substring(8, 10), 10);

  const monthName = longMonth ? months[dateMonth] : months[dateMonth].substring(0, 3);
  const yearName = longYear ? dateYear.toString() : `'${dateYear.toString().substring(2, 4)}`;

  if (showYear) {
    if (showDay) {
      return `${dateDay} ${monthName} ${yearName}`;
    }

    return `${monthName} ${yearName}`;
  }

  return `${dateDay} ${monthName}`;
}

function isValidDate(dateObject: Date | string) {
  return new Date(dateObject).toString() !== 'Invalid Date';
}

export function uniqueBy(
  array: any[],
  predicate: string | ((item: any) => any),
) {
  const filter = typeof predicate === 'function' ? predicate : (object: any) => object[predicate];

  return [
    ...array
      .reduce((map, item) => {
        const key = item === null || item === undefined ? item : filter(item);

        map.has(key) || map.set(key, item);

        return map;
      }, new Map())
      .values(),
  ];
}

export function dateDiffInDays(startDate: Date, endDate: Date) {
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

interface GroupedEvent {
  count: number;
  firstLog: string;
  lastLog: string;
}

export function calculateFrequencyFromGrouppedEvent(groupedEvent: GroupedEvent) {
  const monthDifference = Math.round(
    Math.abs(dateDiffInDays(new Date(groupedEvent.firstLog), new Date(groupedEvent.lastLog)) / 30),
  );

  // This event has only existed for less than 6 months, so we can't know if it'll repeat any more
  if (monthDifference <= 6 && groupedEvent.count < 12) {
    return `${groupedEvent.count || 1}x / year`;
  }

  const frequencyNumberPerMonth = Math.round(
    groupedEvent.count / monthDifference,
  );

  // When potentially less than once per month, check frequency per year
  if (frequencyNumberPerMonth <= 1) {
    const frequencyNumberPerYear = Math.round(
      (groupedEvent.count / monthDifference) * 12,
    );

    if (frequencyNumberPerYear < 12) {
      return `${frequencyNumberPerYear || 1}x / year`;
    }
  }

  if (frequencyNumberPerMonth < 15) {
    return `${frequencyNumberPerMonth}x / month`;
  }

  const frequencyNumberPerWeek = Math.round(
    groupedEvent.count / monthDifference / 4,
  );

  if (frequencyNumberPerWeek < 7) {
    return `${frequencyNumberPerMonth}x / week`;
  }

  const frequencyNumberPerDay = Math.round(
    groupedEvent.count / monthDifference / 30,
  );

  return `${frequencyNumberPerDay}x / day`;
}

type SortableByCount = { count: number };
export function sortByCount(
  objectA: SortableByCount,
  objectB: SortableByCount,
) {
  if (objectA.count < objectB.count) {
    return 1;
  }
  if (objectA.count > objectB.count) {
    return -1;
  }
  return 0;
}

export function validateEmail(email: string) {
  const trimmedEmail = (email || '').trim().toLocaleLowerCase();
  if (!trimmedEmail) {
    return false;
  }

  const requiredCharsNotInEdges = ['@', '.'];
  return requiredCharsNotInEdges.every((char) =>
    trimmedEmail.includes(char) && !trimmedEmail.startsWith(char) && !trimmedEmail.endsWith(char)
  );
}
