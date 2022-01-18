import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';

import pkg from './package.json';

const external = [
  '@react-pdf/textkit/lib/run/height',
  '@react-pdf/textkit/lib/run/descent',
  '@react-pdf/textkit/lib/run/advanceWidth',
  '@react-pdf/textkit/lib/attributedString/ascent',
  '@babel/runtime/helpers/extends',
  '@react-pdf/textkit/lib/attributedString/advanceWidth',
].concat(Object.keys(pkg.dependencies));

const babelConfig = ({ browser }) => ({
  babelrc: false,
  exclude: 'node_modules/**',
  babelHelpers: 'runtime',
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        modules: false,
        ...(browser
          ? { targets: { browsers: 'last 2 versions' } }
          : { targets: { node: '12' } }),
      },
    ],
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', { version: '^7.16.4' }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
  ],
});

const cjsConfig = {
  input: './src/index.js',
  output: {
    format: 'cjs',
    file: 'lib/index.js',
    exports: 'named',
  },
  external,
  plugins: [
    babel(babelConfig({ browser: false })),
    replace({
      preventAssignment: true,
      values: { BROWSER: JSON.stringify(false) },
    }),
  ],
};

const esmConfig = {
  input: './src/index.js',
  output: {
    format: 'esm',
    file: 'lib/index.esm.js',
    exports: 'named',
  },
  external,
  plugins: [
    babel(babelConfig({ browser: true })),
    replace({
      preventAssignment: true,
      values: { BROWSER: JSON.stringify(true) },
    }),
  ],
};

export default [cjsConfig, esmConfig];
