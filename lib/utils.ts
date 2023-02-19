import 'std/dotenv/load.ts';
import { emit } from 'https://deno.land/x/emit@0.15.0/mod.ts';
import sass from 'https://deno.land/x/denosass@1.0.6/mod.ts';
import { serveFile } from 'std/http/file_server.ts';

import header from '/components/header.ts';
import footer from '/components/footer.ts';
import loading from '/components/loading.ts';

// This allows us to have nice html syntax highlighting in template literals
export const html = String.raw;

export const PORT = Deno.env.get('PORT') || 8000;
export const PADDLE_VENDOR_ID = Deno.env.get('PADDLE_VENDOR_ID') || '';
// export const PADDLE_MONTHLY_PLAN_ID = 45375; // Sandbox
export const PADDLE_MONTHLY_PLAN_ID = 814705; // Production
// export const PADDLE_YEARLY_PLAN_ID = 45376; // Sandbox
export const PADDLE_YEARLY_PLAN_ID = 814704; // Production

export const baseUrl = Deno.env.get('BASE_URL') || 'https://app.loggit.net';
export const defaultTitle = 'Loggit — Log your unscheduled events';
export const defaultDescription = 'Simple and encrypted event management.';
export const helpEmail = 'help@loggit.net';

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
      <link rel="stylesheet" href="/public/scss/style.scss">
      <link rel="stylesheet" href="/public/css/style.css">

      <link rel="manifest" href="/public/manifest.json" />
      
      <link rel="alternate" type="application/rss+xml" href="https://loggit.net/rss.xml" />
      <link rel="alternate" type="application/atom+xml" href="https://loggit.net/atom.xml" />
      <link rel="alternate" type="application/feed+json" href="https://loggit.net/feed.json" />
    </head>
    <body>
      ${loading()}
      ${header(currentPath)}
      <section class="wrapper">
        ${htmlContent}
      </section>
      ${footer()}
      <script type="text/javascript">
        window.app = {
          PADDLE_VENDOR_ID: '${PADDLE_VENDOR_ID}',
          PADDLE_MONTHLY_PLAN_ID: '${PADDLE_MONTHLY_PLAN_ID}',
          PADDLE_YEARLY_PLAN_ID: '${PADDLE_YEARLY_PLAN_ID}',
        };
      </script>
      <script src="/public/js/script.js"></script>
      <script src="/public/js/sweetalert.js" defer></script>
      <script src="https://cdn.paddle.com/paddle/paddle.js" defer></script>
    </body>
    </html>
    `;
}

export function basicLayoutResponse(htmlContent: string, options: BasicLayoutOptions) {
  return new Response(basicLayout(htmlContent, options), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy':
        'default-src \'self\'; child-src \'self\' https://buy.paddle.com/ https://sandbox-buy.paddle.com/; img-src \'self\' https://cdn.paddle.com/paddle/ https://sandbox-cdn.paddle.com/paddle/; style-src \'self\' \'unsafe-inline\' https://cdn.paddle.com/paddle/ https://sandbox-cdn.paddle.com/paddle/; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://cdn.paddle.com/paddle/ https://sandbox-cdn.paddle.com/paddle/;',
      'x-frame-options': 'DENY',
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    },
  });
}

export function isRunningLocally(urlPatternResult: URLPatternResult) {
  return ['localhost', 'loggit.local'].includes(urlPatternResult.hostname.input);
}

export function escapeHtml(unsafe: string) {
  return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll('\'', '&#039;');
}

async function transpileTs(content: string, specifier: URL) {
  const urlStr = specifier.toString();
  const result = await emit(specifier, {
    load(specifier: string) {
      if (specifier !== urlStr) {
        return Promise.resolve({ kind: 'module', specifier, content: '' });
      }
      return Promise.resolve({ kind: 'module', specifier, content });
    },
  });
  return result[urlStr];
}

export async function serveFileWithTs(request: Request, filePath: string, extraHeaders?: ResponseInit['headers']) {
  const response = await serveFile(request, filePath);

  if (response.status !== 200) {
    return response;
  }

  const tsCode = await response.text();
  const jsCode = await transpileTs(tsCode, new URL('file:///src.ts'));
  const { headers } = response;
  headers.set('content-type', 'application/javascript; charset=utf-8');
  headers.delete('content-length');

  return new Response(jsCode, {
    status: response.status,
    statusText: response.statusText,
    headers,
    ...(extraHeaders || {}),
  });
}

function transpileSass(content: string) {
  const compiler = sass(content);

  return compiler.to_string('compressed') as string;
}

export async function serveFileWithSass(request: Request, filePath: string, extraHeaders?: ResponseInit['headers']) {
  const response = await serveFile(request, filePath);

  if (response.status !== 200) {
    return response;
  }

  const sassCode = await response.text();
  const cssCode = transpileSass(sassCode);
  const { headers } = response;
  headers.set('content-type', 'text/css; charset=utf-8');
  headers.delete('content-length');

  return new Response(cssCode, {
    status: response.status,
    statusText: response.statusText,
    headers,
    ...(extraHeaders || {}),
  });
}

export function generateRandomCode(length = 6) {
  const getRandomDigit = () => Math.floor(Math.random() * (10)); // 0-9

  const codeDigits = Array.from({ length }).map(getRandomDigit);

  return codeDigits.join('');
}

export function splitArrayInChunks<T = any>(array: T[], chunkLength: number) {
  const chunks = [];
  let chunkIndex = 0;
  const arrayLength = array.length;

  while (chunkIndex < arrayLength) {
    chunks.push(array.slice(chunkIndex, chunkIndex += chunkLength));
  }

  return chunks;
}
