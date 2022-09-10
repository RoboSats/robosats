import path from "path";
import { Configuration } from "webpack";

const config: Configuration = {
  entry: "./src/index.js",
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
};

var configWeb = Object.assign({}, config, {
  name: "configWeb",
  output: {
      path: path.resolve(__dirname, "static/frontend"),
      filename: "main.js",
  },
});
var configMobile = Object.assign({}, config, {
  name: "configMobile",
  output: {
      path: path.resolve(__dirname, "../mobile/html/Web.bundle/js"),
      filename: "main.js",
  },
});

export default [configWeb, configMobile];
