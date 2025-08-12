import path from 'path';
import { Configuration } from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { version } from './package.json';
import { Buffer } from 'buffer';

// Declare __dirname for TypeScript
declare const __dirname: string;

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

const configNode = (env: any, argv: { mode: string }): Configuration => {
  return {
    ...config,
    output: {
      path: path.resolve(__dirname, 'static/frontend'),
      filename:
        argv.mode === 'production' ? `main.v${version}.[contenthash].js` : `main.v${version}.js`,
      clean: true,
      publicPath: '/static/frontend/',
    },
    plugins: [
      // Django
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
        templateParameters: {
          pro: false,
          mobile: false,
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
          mobile: false,
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
          mobile: false,
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
          mobile: false,
        },
        filename: path.resolve(__dirname, '../nodeapp/pro.html'),
        inject: 'body',
        robosatsSettings: 'selfhosted-pro',
        basePath: '/',
      }),

      // Desktop App
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
        templateParameters: {
          pro: false,
          mobile: false,
        },
        filename: path.resolve(__dirname, '../desktopApp/index.html'),
        inject: 'body',
        robosatsSettings: 'desktop-basic',
        basePath: '/',
      }),

      // Web App
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
        templateParameters: {
          pro: false,
          mobile: false,
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
          mobile: false,
        },
        filename: path.resolve(__dirname, '../web/pro.html'),
        inject: 'body',
        robosatsSettings: 'web-pro',
        basePath: '/',
      }),

      new CopyWebpackPlugin({
        patterns: [
          // Copy to nodeapp
          {
            from: path.resolve(__dirname, 'static'),
            to: path.resolve(__dirname, '../nodeapp/static'),
          },
          // Copy to desktopApp
          {
            from: path.resolve(__dirname, 'static'),
            to: path.resolve(__dirname, '../desktopApp/static'),
          },
          // Copy to web
          {
            from: path.resolve(__dirname, 'static'),
            to: path.resolve(__dirname, '../web/static'),
          },
        ],
      }),
    ],
  };
};

const configAndroid = (env: any, argv: { mode: string }): Configuration => {
  return {
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
            replacement: path.resolve(__dirname, 'src/i18n/Mobile.js'),
            async: true,
          },
        },
        {
          test: path.resolve(__dirname, 'src/geo/Web.js'),
          loader: 'file-replace-loader',
          options: {
            condition: 'if-replacement-exists',
            replacement: path.resolve(__dirname, 'src/geo/Mobile.js'),
            async: true,
          },
        },
        {
          test: path.resolve(__dirname, 'src/services/Roboidentities/Web.ts'),
          loader: 'file-replace-loader',
          options: {
            condition: 'if-replacement-exists',
            replacement: path.resolve(__dirname, 'src/services/Roboidentities/Android.ts'),
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
      path: path.resolve(__dirname, '../android/app/src/main/assets/static/frontend'),
      filename:
        argv.mode === 'production' ? `main.v${version}.[contenthash].js` : `main.v${version}.js`,
      clean: true,
      publicPath: './static/frontend/',
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'templates/frontend/index.ejs'),
        templateParameters: {
          pro: false,
          mobile: true,
        },
        filename: path.resolve(__dirname, '../android/app/src/main/assets/index.html'),
        inject: 'body',
        robosatsSettings: 'mobile-basic',
        basePath: 'file:///android_asset/',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'static/css'),
            to: path.resolve(__dirname, '../android/app/src/main/assets/static/css'),
            transform(content, path) {
              if (path.endsWith('.css')) {
                let cssContent = content.toString();
                cssContent = cssContent.replace(
                  /url\(\/static\/css\/fonts\/roboto/g,
                  'url(file:///android_asset/static/css/fonts/roboto',
                );
                return Buffer.from(cssContent);
              }
              return content;
            },
          },
          {
            from: path.resolve(__dirname, 'static/assets/sounds'),
            to: path.resolve(__dirname, '../android/app/src/main/assets/static/assets/sounds'),
          },
          {
            from: path.resolve(__dirname, 'static/federation'),
            to: path.resolve(__dirname, '../android/app/src/main/assets/static/assets/federation'),
          },
        ],
      }),
    ],
  };
};

export default (env: any, argv: { mode: string }) => [
  configNode(env, argv),
  configAndroid(env, argv),
];
