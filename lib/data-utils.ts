import userbase from 'userbase-js';
import Swal from 'sweetalert2';
import moment from 'moment';

import { sortByDate, showNotification, splitArrayInChunks } from './utils';
import * as T from './types';

const USERBASE_APP_ID = process.env.NEXT_PUBLIC_USERBASE_APP_ID;

const cachedData: { events: T.Event[] } = {
  events: [],
};

const hasFinishedLoading = {
  events: false,
};

const sessionLengthInHours = 90 * 24;

export const validateLogin = async (email: string, password: string) => {
  try {
    await userbase.signIn({
      username: email,
      password,
      sessionLength: sessionLengthInHours,
      rememberMe: 'local',
    });
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, error };
  }
};

export const createAccount = async (email: string, password: string) => {
  try {
    await userbase.signUp({
      username: email,
      password,
      sessionLength: sessionLengthInHours,
      rememberMe: 'local',
      email,
    });
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, error };
  }
};

const getEventFromItem = (item: userbase.Item) => {
  try {
    return {
      id: item.itemId,
      name: item.item.name,
      date: item.item.date,
    } as T.Event;
  } catch (error) {
    return null;
  }
};

const loadItemsAsync = async () => {
  await userbase.openDatabase({
    databaseName: 'events',
    changeHandler: async (items) => {
      const events = items
        .map(getEventFromItem)
        .filter((event) => Boolean(event));

      hasFinishedLoading.events = true;

      cachedData.events = events;
    },
  });
};

export const initializeDb = async () => {
  try {
    await userbase.init({
      appId: USERBASE_APP_ID,
      sessionLength: sessionLengthInHours,
    });

    await loadItemsAsync();
  } catch (error) {
    console.log(error);
    showNotification(error, 'error');
  }
};

export const fetchEvents = async (month?: string) => {
  try {
    // Very ugly, but... works.
    while (!hasFinishedLoading.events) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }

    const sortedEvents = cachedData.events
      .filter((event) => {
        if (!month) {
          return true;
        }

        if (event.date >= `${month}-01` && event.date <= `${month}-31`) {
          return true;
        }

        return false;
      })
      .sort(sortByDate)
      .reverse();

    return sortedEvents;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong fetching events.',
    });

    console.error(error);
  }

  return [];
};

export const saveEvent = async (event: T.Event) => {
  try {
    if (event.name.trim().length === 0) {
      showNotification('The event needs a valid name.', 'error');
      return false;
    }

    if (!moment(event.date, 'YYYY-MM-DD').isValid()) {
      event.date = moment().format('YYYY-MM-DD');
    }

    if (event.id === 'newEvent') {
      event.id = `${Date.now().toString()}:${Math.random()}`;

      await userbase.insertItem({
        databaseName: 'events',
        item: {
          name: event.name,
          date: event.date,
        } as T.EventContent,
        itemId: event.id,
      });
    } else {
      await userbase.updateItem({
        databaseName: 'events',
        item: {
          name: event.name,
          date: event.date,
        } as T.EventContent,
        itemId: event.id,
      });
    }

    return true;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong saving that event.',
    });

    console.error(error);
  }

  return false;
};

export const deleteEvent = async (eventId: string) => {
  try {
    await userbase.deleteItem({
      databaseName: 'events',
      itemId: eventId,
    });

    const cachedItemIndex = cachedData.events.findIndex(
      (budget) => budget.id === eventId,
    );
    if (cachedItemIndex !== -1) {
      cachedData.events.splice(cachedItemIndex, 1);
    }

    return true;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong deleting that event.',
    });

    console.error(error);
  }

  return false;
};

export const deleteAllData = async () => {
  const events = await fetchEvents();

  const deleteEventChunks: T.Event[][] = splitArrayInChunks(events, 10);

  for (const eventsToDelete of deleteEventChunks) {
    await userbase.putTransaction({
      databaseName: 'events',
      operations: eventsToDelete.map((event) => ({
        command: 'Delete',
        itemId: event.id,
      })),
    });

    // Wait a second, to avoid hitting rate limits
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  cachedData.events.length = 0;
  hasFinishedLoading.events = false;
};

type ExportAllData = () => Promise<{
  events?: T.Event[];
}>;

export const exportAllData: ExportAllData = async () => {
  // Don't export anything until we're done with the first full load
  if (!hasFinishedLoading.events) {
    return {};
  }

  try {
    const events = (await fetchEvents()).sort(sortByDate);
    return { events };
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong exporting data.',
    });

    console.error(error);
  }

  return {};
};

export const importData = async (
  replaceData: boolean,
  events: T.Event[],
) => {
  // Don't import anything until we're done with the first full load
  if (!hasFinishedLoading.events) {
    return {};
  }

  try {
    if (replaceData) {
      await deleteAllData();

      await initializeDb();

      // Very ugly, but... works.
      while (!hasFinishedLoading.events) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      }
    }

    const finalEventsToAdd: T.Event[] = [];

    for (const event of events) {
      const newEventId = `${Date.now().toString()}:${Math.random()}`;
      const newEvent: T.Event = {
        id: newEventId,
        name: event.name,
        date: event.date,
      };

      finalEventsToAdd.push(newEvent);
    }

    const addEventChunks: T.Event[][] = splitArrayInChunks(
      finalEventsToAdd,
      10,
    );

    for (const eventsToAdd of addEventChunks) {
      await userbase.putTransaction({
        databaseName: 'events',
        operations: eventsToAdd.map((event) => ({
          command: 'Insert',
          item: {
            name: event.name,
            date: event.date,
          } as T.EventContent,
          itemId: event.id,
        })),
      });

      // Wait a second, to avoid hitting rate limits
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }

    return true;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong importing data.',
    });

    console.error(error);
  }

  return false;
};
