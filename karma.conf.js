"use strict";

module.exports = karma => {
	karma.set({
		browsers:   ["ChromeHeadless"],
		frameworks: ["mocha"],
		reporters:  ["mocha"],
		singleRun:  true,
		files: [
			"node_modules/chai/chai.js",
			"browser.js",
			"test/dom-spec.js",
		],
	});
};
