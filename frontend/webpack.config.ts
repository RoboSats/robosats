import path from 'path';
import { Configuration } from 'webpack';
import FileManagerPlugin from 'filemanager-webpack-plugin';
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
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
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
    publicPath: '/static/frontend/',
  },
  plugins: [
    // Django
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
      templateParameters: {
        pro: false,
      },
      filename: path.resolve(__dirname, 'templates/frontend/basic.html'),
      inject: 'body',
      robosatsSettings: 'web-basic',
      basePath: '/',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
      templateParameters: {
        pro: true,
      },
      filename: path.resolve(__dirname, 'templates/frontend/pro.html'),
      inject: 'body',
      robosatsSettings: 'web-pro',
      basePath: '/',
    }),
    // Node App
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
      templateParameters: {
        pro: false,
      },
      filename: path.resolve(__dirname, '../nodeapp/basic.html'),
      inject: 'body',
      robosatsSettings: 'selfhosted-basic',
      basePath: '/',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
      templateParameters: {
        pro: true,
      },
      filename: path.resolve(__dirname, '../nodeapp/pro.html'),
      inject: 'body',
      robosatsSettings: 'selfhosted-pro',
      basePath: '/',
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: path.resolve(__dirname, 'static'),
              destination: path.resolve(__dirname, '../nodeapp/static'),
            },
          ],
        },
      },
    }),
    // Desktop App
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
      templateParameters: {
        pro: false,
      },
      filename: path.resolve(__dirname, '../desktopApp/index.html'),
      inject: 'body',
      robosatsSettings: 'desktop-basic',
      basePath: '/',
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: path.resolve(__dirname, 'static'),
              destination: path.resolve(__dirname, '../desktopApp/static'),
            },
          ],
        },
      },
    }),
    // Web App
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
      templateParameters: {
        pro: false,
      },
      filename: path.resolve(__dirname, '../web/basic.html'),
      inject: 'body',
      robosatsSettings: 'web-basic',
      basePath: '/',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
      templateParameters: {
        pro: true,
      },
      filename: path.resolve(__dirname, '../web/pro.html'),
      inject: 'body',
      robosatsSettings: 'web-pro',
      basePath: '/',
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: path.resolve(__dirname, 'static'),
              destination: path.resolve(__dirname, '../web/static'),
            },
          ],
        },
      },
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
  output: {
    path: path.resolve(__dirname, '../mobile/html/Web.bundle/static/frontend'),
    filename: `main.v${version}.[contenthash].js`,
    clean: true,
    publicPath: './static/frontend/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
      templateParameters: {
        pro: false,
      },
      filename: path.resolve(__dirname, '../mobile/html/Web.bundle/index.html'),
      inject: 'body',
      robosatsSettings: 'mobile-basic',
      basePath: './',
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: path.resolve(__dirname, 'static/css'),
              destination: path.resolve(__dirname, '../mobile/html/Web.bundle/static/css'),
            },
            {
              source: path.resolve(__dirname, 'static/assets/sounds'),
              destination: path.resolve(__dirname, '../mobile/html/Web.bundle/assets/sounds'),
            },
            {
              source: path.resolve(__dirname, 'static/federation'),
              destination: path.resolve(__dirname, '../mobile/html/Web.bundle/assets/federation'),
            },
          ],
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
      templateParameters: {
        pro: false,
      },
      filename: path.resolve(__dirname, '../mobile_new/app/src/main/assets/index.html'),
      inject: 'body',
      robosatsSettings: 'mobile-basic',
      basePath: 'file:///android_asset/Web.bundle/',
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: path.resolve(__dirname, 'static/css'),
              destination: path.resolve(
                __dirname,
                '../mobile_new/app/src/main/assets/Web.bundle/static/css',
              ),
            },
            {
              source: path.resolve(__dirname, 'static/assets/sounds'),
              destination: path.resolve(
                __dirname,
                '../mobile_new/app/src/main/assets/Web.bundle/assets/sounds',
              ),
            },
            {
              source: path.resolve(__dirname, 'static/federation'),
              destination: path.resolve(
                __dirname,
                '../mobile_new/app/src/main/assets/Web.bundle/assets/federation',
              ),
            },
          ],
        },
      },
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: path.resolve(__dirname, '../mobile/html/Web.bundle/static/frontend'),
              destination: path.resolve(
                __dirname,
                '../mobile_new/app/src/main/assets/static/frontend',
              ),
            },
          ],
        },
      },
    }),
  ],
};

export default [configNode, configMobile];
