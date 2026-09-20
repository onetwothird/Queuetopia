const path = require('path');

/**
 * CI smoke bundle for the pure scheduling engine.
 *
 * `lib/algorithms.ts` is framework-free by design (see README), so it can be
 * bundled standalone and exercised in Node without Next.js. This config is
 * intentionally minimal: transpile-only TypeScript, single entry, UMD output.
 */
module.exports = {
  mode: 'production',
  target: 'node',
  entry: path.resolve(__dirname, 'lib/algorithms.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'algorithms.bundle.js',
    library: { name: 'Algorithms', type: 'umd' },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: { transpileOnly: true },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
};