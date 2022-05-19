import * as R from 'ramda';

import StandardFont from './standardFont';

const fontCache = {};

const IGNORED_CODE_POINTS = [173, 32, 10];

const getFontSize = R.pathOr(12, ['attributes', 'fontSize']);

const getOrCreateFont = name => {
  if (fontCache[name]) return fontCache[name];

  const font = new StandardFont(name);
  fontCache[name] = font;

  return font;
};

const getFallbackFont = () => getOrCreateFont('Helvetica');

const getDoesFontHaveGlyph = (font, codePoint) =>
  font &&
  (IGNORED_CODE_POINTS.includes(codePoint) ||
    font.hasGlyphForCodePoint(codePoint));

const getFontWithFallback = (codePoint, font, backupFont, lastFont) => {
  if (getDoesFontHaveGlyph(lastFont, codePoint)) {
    return lastFont;
  }

  if (getDoesFontHaveGlyph(font, codePoint)) {
    return font;
  }

  if (getDoesFontHaveGlyph(backupFont, codePoint)) {
    return backupFont;
  }

  if (getFallbackFont().hasGlyphForCodePoint(codePoint)) {
    return getFallbackFont();
  }
  return lastFont || backupFont;
};

const fontSubstitution = () => ({ string, runs }) => {
  let lastFont = null;
  let lastFontSize = null;
  let lastIndex = 0;
  let index = 0;

  const res = [];
  for (let i = 0; i < runs.length; i += 1) {
    const run = runs[i];

    const originalFont =
      typeof run.attributes.font === 'string'
        ? getOrCreateFont(run.attributes.font)
        : run.attributes.font;
    const defaultOriginalFont =
      typeof run.attributes.font === 'string'
        ? getOrCreateFont(run.attributes.backupFont)
        : run.attributes.backupFont;

    if (string.length === 0) {
      res.push({ start: 0, end: 0, attributes: { font: originalFont } });
      break;
    }

    const chars = string.slice(run.start, run.end);

    for (let j = 0; j < chars.length; j += 1) {
      const char = chars[j];
      const codePoint = char.codePointAt();
      // If the default font does not have a glyph and the fallback font does, we use it
      const font = getFontWithFallback(
        codePoint,
        originalFont,
        defaultOriginalFont,
        lastFont,
      );
      const fontSize = getFontSize(run);

      // If anything that would impact res has changed, update it
      if (
        font !== lastFont ||
        fontSize !== lastFontSize ||
        font.unitsPerEm !== lastFont?.unitsPerEm
      ) {
        if (lastFont) {
          res.push({
            start: lastIndex,
            end: index,
            attributes: {
              font: lastFont,
              scale: lastFontSize / lastFont.unitsPerEm,
            },
          });
        }

        lastFont = font;
        lastFontSize = fontSize;
        lastIndex = index;
      }

      index += char.length;
    }
  }

  if (lastIndex < string.length) {
    const fontSize = getFontSize(R.last(runs));

    res.push({
      start: lastIndex,
      end: string.length,
      attributes: {
        font: lastFont,
        scale: fontSize / lastFont.unitsPerEm,
      },
    });
  }

  return { string, runs: res };
};

export default fontSubstitution;
