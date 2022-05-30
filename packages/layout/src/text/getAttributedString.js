import * as P from '@react-pdf/primitives';
import fromFragments from '@react-pdf/textkit/lib/attributedString/fromFragments';

import { embedEmojis } from './emoji';
import ignoreChars from './ignoreChars';
import transformText from './transformText';

const PREPROCESSORS = [ignoreChars, embedEmojis];

const isImage = node => node.type === P.Image;

const isTextInstance = node => node.type === P.TextInstance;

const toFontNameStack = (...fontFamilyObjects) =>
  fontFamilyObjects
    .map(fontFamilies =>
      typeof fontFamilies === 'string'
        ? fontFamilies.split(',').map(f => f.trim())
        : Array.from(fontFamilies || []),
    )
    .flat()
    .reduce(
      (fonts, font) => (fonts.includes(font) ? fonts : [...fonts, font]),
      [],
    );

const getFontStack = (fontStore, { fontFamily, fontStyle, fontWeight }) =>
  toFontNameStack(fontFamily).map(fontFamilyName => {
    if (typeof fontFamilyName !== 'string') return fontFamilyName;

    const opts = { fontFamily: fontFamilyName, fontWeight, fontStyle };
    const obj = fontStore ? fontStore.getFont(opts) : null;
    return obj ? obj.data : fontFamilyName;
  });

/**
 * Get textkit fragments of given node object
 *
 * @param {Object} font store
 * @param {Object} instance node
 * @returns {Array} text fragments
 */
const getFragments = (fontStore, instance, parentLink, level = 0) => {
  if (!instance) return [{ string: '' }];

  let fragments = [];

  const {
    color = 'black',
    direction = 'ltr',
    fontFamily = 'Helvetica',
    fontWeight,
    fontStyle,
    fontSize = 18,
    textAlign,
    lineHeight,
    textDecoration,
    textDecorationColor,
    textDecorationStyle,
    textTransform,
    letterSpacing,
    textIndent,
    opacity,
  } = instance.style;

  const fontStack = getFontStack(fontStore, {
    fontFamily,
    fontStyle,
    fontWeight,
  });

  // Don't pass main background color to textkit. Will be rendered by the render package instead
  const backgroundColor = level === 0 ? null : instance.style.backgroundColor;

  const attributes = {
    fontStack,
    color,
    opacity,
    fontSize,
    direction,
    backgroundColor,
    indent: textIndent,
    characterSpacing: letterSpacing,
    strikeStyle: textDecorationStyle,
    underlineStyle: textDecorationStyle,
    underline:
      textDecoration === 'underline' ||
      textDecoration === 'underline line-through' ||
      textDecoration === 'line-through underline',
    strike:
      textDecoration === 'line-through' ||
      textDecoration === 'underline line-through' ||
      textDecoration === 'line-through underline',
    strikeColor: textDecorationColor || color,
    underlineColor: textDecorationColor || color,
    link: parentLink || instance.props?.src || instance.props?.href,
    lineHeight: lineHeight ? lineHeight * fontSize : null,
    align: R.or(textAlign, direction === 'rtl' ? 'right' : 'left'),
  };

  for (let i = 0; i < instance.children.length; i += 1) {
    const child = instance.children[i];

    if (isImage(child)) {
      fragments.push({
        string: String.fromCharCode(0xfffc),
        attributes: {
          ...attributes,
          attachment: {
            width: child.style.width || fontSize,
            height: child.style.height || fontSize,
            image: child.image.data,
          },
        },
      });
    } else if (isTextInstance(child)) {
      fragments.push({
        string: transformText(child.value, textTransform),
        attributes,
      });
    } else if (child) {
      fragments.push(
        ...getFragments(fontStore, child, attributes.link, level + 1),
      );
    }
  }

  for (let i = 0; i < PREPROCESSORS.length; i += 1) {
    const preprocessor = PREPROCESSORS[i];
    fragments = preprocessor(fragments);
  }

  return fragments;
};

/**
 * Get textkit attributed string from text node
 *
 * @param {Object} font store
 * @param {Object} instance node
 * @returns {Object} attributed string
 */
const getAttributedString = (fontStore, instance) => {
  const fragments = getFragments(fontStore, instance);
  return fromFragments(fragments);
};

export default getAttributedString;
