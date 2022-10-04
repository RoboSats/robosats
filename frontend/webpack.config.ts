import path from 'path';
import { Configuration } from 'webpack';
import CopyPlugin from "copy-webpack-plugin"

const config: Configuration = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
};

const configWeb: Configuration = {
  ...config,
  output: {
    path: path.resolve(__dirname, 'static/frontend'),
    filename: 'main.js',
  },
};

const configMobile: Configuration = {
  ...config,
  module: {
    ...config.module,
    rules: [
      ...(config?.module?.rules || []),
      {
        test: path.resolve(__dirname, 'src/components/i18n.js'),
        loader: 'file-replace-loader',
        options: {
          condition: 'if-replacement-exists',
          replacement: path.resolve(__dirname, 'src/components/i18n.Native.js'),
          async: true,
        },
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { 
          from: path.resolve(__dirname, 'static/css'), 
          to: path.resolve(__dirname, '../mobile/html/Web.bundle/css') 
        }
      ],
    }),
  ],
  output: {
    path: path.resolve(__dirname, '../mobile/html/Web.bundle/js'),
    filename: 'main.js',
  },
};

export default [configWeb, configMobile];
