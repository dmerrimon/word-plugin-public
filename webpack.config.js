const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    taskpane: "./src/taskpane/taskpane.tsx",
    commands: "./src/commands/commands.ts"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".html", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        use: "html-loader"
      },
      {
        test: /\.(png|jpg|jpeg|gif|ico)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/[name][ext]"
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "taskpane.html",
      template: "./src/taskpane/taskpane.html",
      chunks: ["taskpane"]
    }),
    new HtmlWebpackPlugin({
      filename: "commands.html",
      template: "./src/commands/commands.html",
      chunks: ["commands"]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "assets/*",
          to: "assets/[name][ext]"
        }
      ]
    })
  ],
  devServer: {
    port: 3000,
    https: true,
    hot: true,
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  }
};