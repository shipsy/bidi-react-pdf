import * as R from 'ramda';

/**
 * Test font substitution based on the string 'Lorem'
 * Returns emp if no runs present, or arbitrary font substitution otherwise
 *
 *  *   L     o     r     e     m
 * |---- Level 1 ------|-- Level 2 -|
 *
 * @param  {Object}  attributed string
 * @return {Object} attributed string
 */
export const bidiEngineImpl = jest.fn(
  R.evolve({
    runs: R.ifElse(
      R.isEmpty,
      R.always([]),
      R.always([
        { start: 0, end: 3, attributes: { bidiLevel: 0 } },
        { start: 3, end: 5, attributes: { bidiLevel: 1 } },
      ]),
    ),
  }),
);

const bidiEngine = jest.fn(() => bidiEngineImpl);
export default bidiEngine;
