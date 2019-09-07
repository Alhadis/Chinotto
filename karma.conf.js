"use strict";

module.exports = karma => {
	karma.set({
		frameworks: ["mocha"],
		reporters: ["mocha"],
		files: [
			"node_modules/chai/chai.js",
			"browser.js",
			"test/dom-spec.js",
		],
		browsers: ["ChromeHeadless"],
		singleRun: true,
	});
};
