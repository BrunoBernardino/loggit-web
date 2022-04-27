import { assertEquals } from 'https://deno.land/std@0.135.0/testing/asserts.ts';
import { calculateFrequencyFromGrouppedEvent, dateDiffInDays, escapeHtml, splitArrayInChunks } from './utils.ts';

Deno.test('that escapeHtml works', () => {
  const tests = [
    {
      input: '<a href="https://brunobernardino.com">URL</a>',
      expected: '&lt;a href=&quot;https://brunobernardino.com&quot;&gt;URL&lt;/a&gt;',
    },
    {
      input: '"><img onerror=\'alert(1)\' />',
      expected: '&quot;&gt;&lt;img onerror=&#039;alert(1)&#039; /&gt;',
    },
  ];

  for (const test of tests) {
    const output = escapeHtml(test.input);
    assertEquals(output, test.expected);
  }
});

Deno.test('that splitArrayInChunks works', () => {
  const tests = [
    {
      input: {
        array: [
          { number: 1 },
          { number: 2 },
          { number: 3 },
          { number: 4 },
          { number: 5 },
          { number: 6 },
        ],
        chunkLength: 2,
      },
      expected: [
        [{ number: 1 }, { number: 2 }],
        [{ number: 3 }, { number: 4 }],
        [{ number: 5 }, { number: 6 }],
      ],
    },
    {
      input: {
        array: [
          { number: 1 },
          { number: 2 },
          { number: 3 },
          { number: 4 },
          { number: 5 },
        ],
        chunkLength: 2,
      },
      expected: [
        [{ number: 1 }, { number: 2 }],
        [{ number: 3 }, { number: 4 }],
        [{ number: 5 }],
      ],
    },
    {
      input: {
        array: [
          { number: 1 },
          { number: 2 },
          { number: 3 },
          { number: 4 },
          { number: 5 },
          { number: 6 },
        ],
        chunkLength: 3,
      },
      expected: [
        [{ number: 1 }, { number: 2 }, { number: 3 }],
        [{ number: 4 }, { number: 5 }, { number: 6 }],
      ],
    },
  ];

  for (const test of tests) {
    const output = splitArrayInChunks(
      test.input.array,
      test.input.chunkLength,
    );
    assertEquals(output, test.expected);
  }
});

Deno.test('that dateDiffInDays works', () => {
  const tests = [
    {
      input: {
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-01-01'),
      },
      expected: 0,
    },
    {
      input: {
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-01-02'),
      },
      expected: 1,
    },
    {
      input: {
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-12-02'),
      },
      expected: 335,
    },
  ];

  for (const test of tests) {
    const output = dateDiffInDays(
      test.input.startDate,
      test.input.endDate,
    );
    assertEquals(output, test.expected);
  }
});

Deno.test('that calculateFrequencyFromGrouppedEvent works', () => {
  const tests = [
    {
      input: {
        count: 12,
        firstLog: '2022-01-01',
        lastLog: '2022-12-01',
      },
      expected: '1x / month',
    },
    {
      input: {
        count: 16,
        firstLog: '2022-01-01',
        lastLog: '2022-12-01',
      },
      expected: '1x / month',
    },
    {
      input: {
        count: 18,
        firstLog: '2022-01-01',
        lastLog: '2022-12-01',
      },
      expected: '2x / month',
    },
    {
      input: {
        count: 30,
        firstLog: '2022-01-01',
        lastLog: '2022-12-01',
      },
      expected: '3x / month',
    },
    {
      input: {
        count: 2,
        firstLog: '2022-01-01',
        lastLog: '2022-01-06',
      },
      expected: '2x / year',
    },
    {
      input: {
        count: 30,
        firstLog: '2022-01-01',
        lastLog: '2022-01-30',
      },
      expected: '1x / day',
    },
    {
      input: {
        count: 10,
        firstLog: '2022-01-01',
        lastLog: '2022-01-30',
      },
      expected: '10x / year',
    },
    {
      input: {
        count: 1,
        firstLog: '2022-01-01',
        lastLog: '2022-01-30',
      },
      expected: '1x / year',
    },
    {
      input: {
        count: 1,
        firstLog: '2022-01-01',
        lastLog: '2022-02-30',
      },
      expected: '1x / year',
    },
    {
      input: {
        count: 1,
        firstLog: '2022-01-01',
        lastLog: '2025-01-30',
      },
      expected: '1x / year',
    },
    {
      input: {
        count: 2,
        firstLog: '2022-01-01',
        lastLog: '2025-01-30',
      },
      expected: '1x / year',
    },
  ];

  for (const test of tests) {
    const output = calculateFrequencyFromGrouppedEvent(
      test.input,
    );
    assertEquals(output, test.expected);
  }
});
