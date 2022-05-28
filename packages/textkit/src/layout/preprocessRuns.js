import omit from '../run/omit';
import flatten from '../run/flatten';
import empty from '../attributedString/empty';
import isNil from '../../../fns/isNil';

const omitFontStack = attributedString => {
  const runs = attributedString.runs.map(run => omit('fontStack', run));
  return Object.assign({}, attributedString, { runs });
};

/**
 * Performs font substitution and script itemization on attributed string
 *
 * @param  {Object}  engines
 * @param  {Object}  layout options
 * @param  {Object}  attributed string
 * @return {Object} processed attributed string
 */
const preprocessRuns = (engines, options) => attributedString => {
  if (isNil(attributedString)) return empty();

  const { string } = attributedString;
  const { fontSubstitution, scriptItemizer, bidi } = engines;

  const { runs: omittedFontStackRuns } = omitFontStack(attributedString);
  const { runs: substitutedRuns } = fontSubstitution(options)(attributedString);
  const { runs: itemizationRuns } = scriptItemizer(options)(attributedString);
  const { runs: bidiRuns } = bidi(options)(attributedString);

  const runs = bidiRuns.concat(substitutedRuns).concat(itemizationRuns).concat(omittedFontStackRuns);

  return { string, runs: flatten(runs) };
};

export default preprocessRuns;
