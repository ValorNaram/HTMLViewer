const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  output: {
    publicPath: "",
  },
  devServer: {
    static: "./app",
    allowedHosts: ["*"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "HTMLSlideshow (Dev)",
      template: "./app/index.html",
      scriptLoading: "defer",
      inject: "head",
    }),
  ],
});
