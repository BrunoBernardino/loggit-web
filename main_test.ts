import { assertEquals } from 'https://deno.land/std@0.142.0/testing/asserts.ts';
import { abortController } from './main.ts';

const baseUrl = 'http://localhost:8000';

Deno.test({
  name: 'HTTP Server',
  fn: async () => {
    let response = await fetch(`${baseUrl}/`);
    assertEquals(response.status, 200);

    let responseText = await response.text();
    assertEquals(responseText.includes('Loggit'), true);

    response = await fetch(`${baseUrl}/blah`);
    assertEquals(response.status, 404);

    responseText = await response.text();
    assertEquals(responseText, 'Not found');

    abortController.abort('Test finished');
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
