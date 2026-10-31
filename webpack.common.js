const path = require("path");

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
};
