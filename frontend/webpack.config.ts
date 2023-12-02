import path from 'path';
import { Configuration } from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';

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

const configWeb: Configuration = {
  ...config,
  output: {
    path: path.resolve(__dirname, 'static/frontend'),
    filename: 'main.js',
  },
};

const configWebSelfhosted: Configuration = {
  ...config,
  module: {
    ...config.module,
    rules: [
      ...(config?.module?.rules || []),
      {
        test: path.resolve(__dirname, 'src/models/Settings.default.basic.ts'),
        loader: 'file-replace-loader',
        options: {
          condition: 'if-replacement-exists',
          replacement: path.resolve(__dirname, 'src/models/Settings.default.basic.selfhosted.ts'),
          async: true,
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'static/frontend'),
    filename: 'basic.selfhosted.js',
  },
};

const configWebPro: Configuration = {
  ...config,
  module: {
    ...config.module,
    rules: [
      ...(config?.module?.rules || []),
      {
        test: path.resolve(__dirname, 'src/basic/Main.tsx'),
        loader: 'file-replace-loader',
        options: {
          condition: 'if-replacement-exists',
          replacement: path.resolve(__dirname, 'src/pro/Main.tsx'),
          async: true,
        },
      },
      {
        test: path.resolve(__dirname, 'src/models/Settings.default.basic.ts'),
        loader: 'file-replace-loader',
        options: {
          condition: 'if-replacement-exists',
          replacement: path.resolve(__dirname, 'src/models/Settings.default.pro.ts'),
          async: true,
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'static/frontend'),
    filename: 'pro.js',
  },
};

const configWebProSelfhosted: Configuration = {
  ...config,
  module: {
    ...config.module,
    rules: [
      ...(config?.module?.rules || []),
      {
        test: path.resolve(__dirname, 'src/basic/Main.tsx'),
        loader: 'file-replace-loader',
        options: {
          condition: 'if-replacement-exists',
          replacement: path.resolve(__dirname, 'src/pro/Main.tsx'),
          async: true,
        },
      },
      {
        test: path.resolve(__dirname, 'src/models/Settings.default.basic.ts'),
        loader: 'file-replace-loader',
        options: {
          condition: 'if-replacement-exists',
          replacement: path.resolve(__dirname, 'src/models/Settings.default.pro.selfhosted.ts'),
          async: true,
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'static/frontend'),
    filename: 'pro.selfhosted.js',
  },
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
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'static/css'),
          to: path.resolve(__dirname, '../mobile/html/Web.bundle/css'),
        },
        {
          from: path.resolve(__dirname, 'static/assets/sounds'),
          to: path.resolve(__dirname, '../mobile/html/Web.bundle/assets/sounds'),
        },
      ],
    }),
  ],
  output: {
    path: path.resolve(__dirname, '../mobile/html/Web.bundle/js'),
    filename: 'main.js',
  },
};

export default [configWeb, configWebPro, configWebSelfhosted, configWebProSelfhosted, configMobile];
