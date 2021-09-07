import { splitArrayInChunks } from './utils';

describe('lib/utils', () => {
  it('.splitArrayInChunks', () => {
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
      const result = splitArrayInChunks(
        test.input.array,
        test.input.chunkLength,
      );
      expect(result).toEqual(test.expected);
    }
  });
});
