const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	resolve: {
		extensions: [".js"],
	},
	output: {
		filename: "HTMLSlideshow-bundle.js",
		path: path.resolve(__dirname, "dist"),
		globalObject: "this",
		publicPath: "/",
		clean: true,
	},
	entry: "./app/js/index.js",
	plugins: [
		new HtmlWebpackPlugin({
			title: "HTMLSlideshow",
			template: "./app/index.html",
			scriptLoading: "defer",
			inject: "head",
		}),
	],
};
