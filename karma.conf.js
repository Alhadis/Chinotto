"use strict";

module.exports = karma => {
	karma.set({
		browsers:   ["ChromeHeadless"],
		frameworks: ["mocha"],
		reporters:  ["mocha", "coverage"],
		singleRun:  true,
		files: [
			"node_modules/chai/chai.js",
			"browser.js",
			"test/dom-spec.js",
		],
		preprocessors: {
			"*.js": ["coverage"],
		},
		coverageReporter: {
			dir: ".nyc_output",
			subdir: "browsers",
			file: "coverage.json",
			type: "json",
		},
	});
};
