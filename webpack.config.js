const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

process.env.NODE_ENV = 'production';

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'with-google-sheets.js',
    library: 'withGoogleSheets',
    libraryTarget: 'umd',
  },
  externals: {
    react: 'react',
  },
  plugins: [new UglifyJsPlugin()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            compact: true,
            plugins: [
              [require.resolve('babel-plugin-lodash'), { id: ['recompose'] }],
            ],
            presets: [require.resolve('babel-preset-react-app')],
          },
        },
      },
    ],
  },
};
