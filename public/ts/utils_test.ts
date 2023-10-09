import { assertEquals } from 'std/assert/assert_equals.ts';
import {
  calculateCurrentMonthFrequencyFromGrouppedEvent,
  calculateFrequencyFromGrouppedEvent,
  dateDiffInDays,
  validateEmail,
} from './utils.ts';

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

Deno.test('that validateEmail works', () => {
  const tests: { email: string; expected: boolean }[] = [
    { email: 'user@example.com', expected: true },
    { email: 'u@e.c', expected: true },
    { email: 'user@example.', expected: false },
    { email: '@example.com', expected: false },
    { email: 'user@example.', expected: false },
    { email: 'ABC', expected: false },
  ];

  for (const test of tests) {
    const result = validateEmail(test.email);
    assertEquals(result, test.expected);
  }
});

Deno.test('that calculateCurrentMonthFrequencyFromGrouppedEvent works', () => {
  const tests = [
    {
      input: {
        count: 12,
        firstLog: '2022-01-01',
        lastLog: '2022-01-31',
      },
      expected: '3x / week',
    },
    {
      input: {
        count: 16,
        firstLog: '2022-01-01',
        lastLog: '2022-01-31',
      },
      expected: '4x / week',
    },
    {
      input: {
        count: 18,
        firstLog: '2022-01-01',
        lastLog: '2022-01-31',
      },
      expected: '5x / week',
    },
    {
      input: {
        count: 30,
        firstLog: '2022-01-01',
        lastLog: '2022-01-31',
      },
      expected: '1x / day',
    },
    {
      input: {
        count: 2,
        firstLog: '2022-01-01',
        lastLog: '2022-01-31',
      },
      expected: '2x',
    },
    {
      input: {
        count: 4,
        firstLog: '2022-01-01',
        lastLog: '2022-01-31',
      },
      expected: '1x / week',
    },
    {
      input: {
        count: 4,
        firstLog: '2022-01-01',
        lastLog: '2022-01-05',
      },
      expected: '4x',
    },
    {
      input: {
        count: 1,
        firstLog: '2022-01-01',
        lastLog: '2022-01-30',
      },
      expected: '1x',
    },
    {
      input: {
        count: 1,
        firstLog: '2022-01-01',
        lastLog: '2022-01-01',
      },
      expected: '1x',
    },
    {
      input: {
        count: 6,
        firstLog: '2022-01-01',
        lastLog: '2022-01-09',
      },
      expected: '6x',
    },
  ];

  for (const test of tests) {
    const output = calculateCurrentMonthFrequencyFromGrouppedEvent(
      test.input,
    );
    assertEquals(output, test.expected);
  }
});
