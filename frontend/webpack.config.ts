import path from 'path';
import { Configuration } from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { version } from './package.json';

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
  experiments: { asyncWebAssembly: true },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
};

const configNode: Configuration = {
  ...config,
  output: {
    path: path.resolve(__dirname, 'static/frontend'),
    filename: `main.v${version}.[contenthash].js`,
    clean: true,
    publicPath: './static/frontend/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/basic.html'),
      filename: path.resolve(__dirname, '../nodeapp/basic.html'),
      robosatsSettings: 'selfhosted-basic',
      inject: 'body',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/pro.html'),
      filename: path.resolve(__dirname, '../nodeapp/pro.html'),
      robosatsSettings: 'selfhosted-pro',
      inject: 'body',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/basic.html'),
      filename: path.resolve(__dirname, '../web/basic.html'),
      robosatsSettings: 'web-basic',
      inject: 'body',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/pro.html'),
      filename: path.resolve(__dirname, '../web/pro.html'),
      robosatsSettings: 'web-pro',
      inject: 'body',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'static'),
          to: path.resolve(__dirname, '../nodeapp/static'),
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'static'),
          to: path.resolve(__dirname, '../web/static'),
        },
      ],
    }),
  ],
};

const configDesktop: Configuration = {
  ...config,
  output: {
    path: path.resolve(__dirname, '../desktopApp/static/frontend'),
    filename: `main.v${version}.[contenthash].js`,
    clean: true,
    publicPath: './static/frontend/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/basic.html'),
      filename: path.resolve(__dirname, '../desktopApp/index.html'),
      robosatsSettings: 'desktop-basic',
      inject: 'body',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'static'),
          to: path.resolve(__dirname, '../desktopApp/static'),
        },
      ],
    }),
  ],
};

const configMobile: Configuration = {
  ...config,
  module: {
    ...config.module,
    rules: [
      ...(config?.module?.rules || []),
      {
        test: path.resolve(__dirname, 'src/i18n/Web.js'),
        loader: 'file-replace-loader',
        options: {
          condition: 'if-replacement-exists',
          replacement: path.resolve(__dirname, 'src/i18n/Native.js'),
          async: true,
        },
      },
      {
        test: path.resolve(__dirname, 'src/geo/Web.js'),
        loader: 'file-replace-loader',
        options: {
          condition: 'if-replacement-exists',
          replacement: path.resolve(__dirname, 'src/geo/Native.js'),
          async: true,
        },
      },
      {
        test: path.resolve(__dirname, 'src/services/Roboidentities/Web.ts'),
        loader: 'file-replace-loader',
        options: {
          condition: 'if-replacement-exists',
          replacement: path.resolve(__dirname, 'src/services/Roboidentities/Native.ts'),
          async: true,
        },
      },
      {
        test: path.resolve(__dirname, 'src/components/RobotAvatar/placeholder.json'),
        loader: 'file-replace-loader',
        options: {
          condition: 'if-replacement-exists',
          replacement: path.resolve(
            __dirname,
            'src/components/RobotAvatar/placeholder_highres.json',
          ),
          async: true,
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/basic.html'),
      filename: path.resolve(__dirname, '../mobile/html/Web.bundle/index.html'),
      robosatsSettings: 'mobile-basic',
      inject: 'body',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'static/css'),
          to: path.resolve(__dirname, '../mobile/html/Web.bundle/static'),
        },
      ],
    }),
  ],
  output: {
    path: path.resolve(__dirname, '../mobile/html/Web.bundle/static/frontend'),
    filename: `main.v${version}.[contenthash].js`,
    clean: true,
    publicPath: './static/frontend/',
  },
};

export default [configNode, configDesktop, configMobile];
