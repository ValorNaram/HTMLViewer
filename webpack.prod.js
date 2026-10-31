const { merge } = require("webpack-merge");

const common = require("./webpack.common.js");
const HtmlWebpackPlugin = require("html-webpack-plugin");


module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",
  output: {
    publicPath: "",
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "HTMLSlideshow",
      template: "./app/index.html",
      inject: false, // Disable auto-injection of scripts/styles
    }),
  ],
});
