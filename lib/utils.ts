try {
  await import('https://deno.land/std@0.135.0/dotenv/load.ts');
} catch (_error) {
  // Do nothing
}

import header from '../components/header.ts';
import footer from '../components/footer.ts';
import loading from '../components/loading.ts';

// This allows us to have nice html syntax highlighting in template literals
export const html = String.raw;

const USERBASE_APP_ID = Deno.env.get('USERBASE_APP_ID') || '';
const sessionLengthInHours = 90 * 24; // 3 months

export const baseUrl = 'https://app.loggit.net';
export const defaultTitle = 'Loggit — Log your unscheduled events';
export const defaultDescription = 'Simple and encrypted event management.';

export interface PageContentResult {
  htmlContent: string;
  titlePrefix?: string;
  description?: string;
}

interface BasicLayoutOptions {
  currentPath: string;
  titlePrefix?: string;
  description?: string;
}

function basicLayout(htmlContent: string, { currentPath, titlePrefix, description }: BasicLayoutOptions) {
  let title = defaultTitle;

  if (titlePrefix) {
    title = `${titlePrefix} - Loggit`;
  }

  return html`
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title}</title>
      <meta name="description" content="${description || defaultDescription}">
      <meta name="author" content="Bruno Bernardino">
      <meta property="og:title" content="${title}" />
      <link rel="icon" href="/public/images/favicon.png" type="image/png">
      <link rel="apple-touch-icon" href="/public/images/favicon.png">
      <link rel="stylesheet" href="/public/css/style.css">

      <link rel="manifest" href="/public/manifest.json" />
      
      <link rel="alternate" type="application/rss+xml" href="https://news.onbrn.com/rss.xml" />
      <link rel="alternate" type="application/atom+xml" href="https://news.onbrn.com/atom.xml" />
      <link rel="alternate" type="application/feed+json" href="https://news.onbrn.com/feed.json" />
    </head>
    <body>
      ${loading()}
      ${header(currentPath)}
      <section class="wrapper">
        ${htmlContent}
      </section>
      ${footer()}
      <script type="text/javascript">
        window.app = {};
        window.app.userbaseConfig = {
          appId: "${USERBASE_APP_ID}",
          sessionLength: ${sessionLengthInHours},
        };
      </script>
      <script src="https://sdk.userbase.com/2/userbase.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
      <script src="/public/js/script.js"></script>
      <script src="https://js.stripe.com/v3/" defer></script>
      <script
        src="https://cdn.usefathom.com/script.js"
        site="NCGAAGVZ"
        defer
      ></script>
    </body>
    </html>
    `;
}

export function basicLayoutResponse(htmlContent: string, options: BasicLayoutOptions) {
  return new Response(basicLayout(htmlContent, options), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy':
        'default-src \'self\' https://*.userbase.com wss://*.userbase.com https://*.stripe.com data: blob:; child-src \'self\' data: blob: https://*.stripe.com; img-src \'self\' https://*.usefathom.com data: blob: https://*.stripe.com; style-src \'self\' \'unsafe-inline\' https://*.stripe.com; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://*.usefathom.com https://*.stripe.com https://*.userbase.com https://*.jsdelivr.net; connect-src \'self\' https://*.userbase.com wss://*.userbase.com https://*.stripe.com;',
      'x-frame-options': 'DENY',
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    },
  });
}

export function isRunningLocally(urlPatternResult: URLPatternResult) {
  return urlPatternResult.hostname.input === 'localhost';
}

// NOTE: The functions below are used in the frontend, but this copy allows for easier testing and type-checking

export function escapeHtml(unsafe: string) {
  return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll('\'', '&#039;');
}

type SortableByDate = { date: string };
export function sortByDate(
  objectA: SortableByDate,
  objectB: SortableByDate,
) {
  if (objectA.date < objectB.date) {
    return -1;
  }
  if (objectA.date > objectB.date) {
    return 1;
  }
  return 0;
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

export function splitArrayInChunks(array: any[], chunkLength: number) {
  const chunks = [];
  let chunkIndex = 0;
  const arrayLength = array.length;

  while (chunkIndex < arrayLength) {
    chunks.push(array.slice(chunkIndex, chunkIndex += chunkLength));
  }

  return chunks;
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
