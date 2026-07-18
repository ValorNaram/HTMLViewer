const { merge } = require("webpack-merge");
const path = require("path");

const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    static: "./app",
	allowedHosts: ["soren-pc", "soren-laptop", "soren-smartphone"]
  },
});
