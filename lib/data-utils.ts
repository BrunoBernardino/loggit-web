import {
  addRxPlugin,
  createRxDatabase,
  PouchDB,
  RxJsonSchema,
  RxDocument,
  RxDatabase,
} from 'rxdb';
import Swal from 'sweetalert2';
import moment from 'moment';

// NOTE: These below are only required for production. Vercel is cleaning them up
// import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBValidatePlugin } from 'rxdb/plugins/validate';
import { RxDBKeyCompressionPlugin } from 'rxdb/plugins/key-compression';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBEncryptionPlugin } from 'rxdb/plugins/encryption';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBWatchForChangesPlugin } from 'rxdb/plugins/watch-for-changes';
import { RxDBReplicationPlugin } from 'rxdb/plugins/replication';
import { RxDBAdapterCheckPlugin } from 'rxdb/plugins/adapter-check';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBInMemoryPlugin } from 'rxdb/plugins/in-memory';
import { RxDBAttachmentsPlugin } from 'rxdb/plugins/attachments';
import { RxDBLocalDocumentsPlugin } from 'rxdb/plugins/local-documents';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';

import { sortByDate, showNotification, splitArrayInChunks } from './utils';
import * as T from './types';

const localDbName = './Loggit__data__v0';

// NOTE: These below are only required for production. Vercel is cleaning them up
// addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBValidatePlugin);
addRxPlugin(RxDBKeyCompressionPlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBEncryptionPlugin);
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBWatchForChangesPlugin);
addRxPlugin(RxDBReplicationPlugin);
addRxPlugin(RxDBAdapterCheckPlugin);
addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBInMemoryPlugin);
addRxPlugin(RxDBAttachmentsPlugin);
addRxPlugin(RxDBLocalDocumentsPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

addRxPlugin(require('pouchdb-adapter-idb'));
addRxPlugin(require('pouchdb-adapter-http'));
PouchDB.plugin(require('pouchdb-erase'));

type EventDocument = RxDocument<T.Event>;
const eventSchema: RxJsonSchema<T.Event> = {
  title: 'event schema',
  description: 'describes an event',
  version: 0,
  keyCompression: true,
  type: 'object',
  properties: {
    id: {
      type: 'string',
      primary: true,
    },
    name: {
      type: 'string',
    },
    date: {
      type: 'string',
    },
  },
  required: ['name', 'date'],
};

const _hasFinishedFirstSync = {
  events: false,
};

export const initializeDb = async (syncToken: string) => {
  if (!syncToken) {
    return null;
  }

  const db = await createRxDatabase({
    name: localDbName,
    adapter: 'idb',
  });

  await db.addCollections({
    events: {
      schema: eventSchema,
    },
  });

  const syncOptions = {
    remote: syncToken,
    options: {
      live: true,
      retry: true,
    },
  };

  const eventsSync = db.events.sync(syncOptions);

  eventsSync.complete$.subscribe((completed) => {
    console.log('eventsSync.complete$', completed);
    _hasFinishedFirstSync.events = true;
  });

  eventsSync.change$.subscribe((docData) => {
    console.log('eventsSync.change$', docData);
  });

  // eventsSync.docs$.subscribe((docs) => {
  //   console.log('eventsSync.docs$', docs);
  // });

  // eventsSync.active$.subscribe((active) => {
  //   console.log('eventsSync.active$', active);
  // });

  eventsSync.error$.subscribe((error) => {
    console.log('eventsSync.error$', error);
  });

  eventsSync.denied$.subscribe((error) => {
    console.log('eventsSync.denied$', error);
  });

  return db;
};

export const fetchEvents = async (db: RxDatabase, month: string) => {
  try {
    const events: EventDocument[] = await db.events
      .find()
      .where('date')
      .gte(`${month}-01`)
      .lte(`${month}-31`)
      .exec();

    const sortedEvents = events
      .map((event) => event.toJSON())
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

export const fetchAllEvents = async (db: RxDatabase) => {
  try {
    const events: EventDocument[] = await db.events
      .find()
      .where('date')
      .gte('2000-01-01')
      .lte('2100-12-31')
      .exec();
    return events
      .map((event) => event.toJSON())
      .sort(sortByDate)
      .reverse();
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong fetching all events.',
    });

    console.error(error);
  }

  return [];
};

export const saveEvent = async (db: RxDatabase, event: T.Event) => {
  try {
    if (event.name.trim().length === 0) {
      showNotification('The event needs a valid name.', 'error');
      return false;
    }

    if (!moment(event.date, 'YYYY-MM-DD').isValid()) {
      event.date = moment().format('YYYY-MM-DD');
    }

    if (event.id === 'newEvent') {
      await db.events.insert({
        ...event,
        id: `${Date.now().toString()}:${Math.random()}`,
      });
    } else {
      const existingEvent: EventDocument = await db.events
        .findOne()
        .where('id')
        .eq(event.id)
        .exec();
      await existingEvent.update({
        $set: {
          name: event.name,
          date: event.date,
        },
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

export const deleteEvent = async (db: RxDatabase, eventId: string) => {
  try {
    const existingEvent: EventDocument = await db.events
      .findOne()
      .where('id')
      .eq(eventId)
      .exec();

    await existingEvent.remove();

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

export const deleteAllData = async (db: RxDatabase, syncToken: string) => {
  await db.events.remove();

  // NOTE: The erase below doesn't work locally, so we need the line above
  const localDb = new PouchDB(localDbName);
  // @ts-ignore erase comes from pouchdb-erase
  await localDb.erase();

  const remoteDb = new PouchDB(syncToken);
  // @ts-ignore erase comes from pouchdb-erase
  await remoteDb.erase();
};

export const deleteLocalData = async (db: RxDatabase) => {
  await db.events.remove();

  // NOTE: The erase below doesn't work locally, so we need the line above
  const localDb = new PouchDB(localDbName);
  // @ts-ignore erase comes from pouchdb-erase
  await localDb.erase();
};

type ExportAllData = (
  db: RxDatabase,
) => Promise<{
  events?: T.Event[];
}>;

export const exportAllData: ExportAllData = async (db) => {
  try {
    // NOTE: The queries look weird because .dump() and simple .find() were returning indexes and other stuff
    const events: EventDocument[] = await db.events
      .find()
      .where('date')
      .gte('2000-01-01')
      .lte('2100-12-31')
      .exec();
    const sortedEvents = events
      .map((event) => {
        const rawEvent = event.toJSON();
        delete rawEvent._rev;
        return rawEvent;
      })
      .sort(sortByDate);
    return { events: sortedEvents };
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
  db: RxDatabase,
  syncToken: string,
  replaceData: boolean,
  events: T.Event[],
) => {
  try {
    if (replaceData) {
      await deleteAllData(db, syncToken);

      // Recreate collections
      await db.addCollections({
        events: {
          schema: eventSchema,
        },
      });
    }

    const chunkLength = 200;

    if (events.length > chunkLength) {
      const chunkedEvents = splitArrayInChunks(events, chunkLength);
      for (const eventsChunk of chunkedEvents) {
        await db.events.bulkInsert(eventsChunk);
        // Wait a second, to avoid hitting rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } else {
      await db.events.bulkInsert(events);
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
