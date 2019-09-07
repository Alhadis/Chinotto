ENV = NODE_OPTIONS='--experimental-modules'

all: dist lint coverage test report


# Generate a bundle in each module flavour we care about
dist: esm cjs umd


# ECMAScript modules
esm: index.mjs
index.mjs: lib/*.mjs
	npx rollup \
		--format esm \
		--preferConst \
		--input lib/index.mjs \
		--file $@
	sed -i~ -e "/^import .* from '[^']*';$$/ s/'\([^']*\)';/"'"\1";/' $@ && rm -f "$@~"
	rm -f "$@~"


# CommonJS/Node.js modules
cjs: index.js
index.js: lib/*.mjs
	npx rollup \
		--format cjs \
		--preferConst \
		--no-interop \
		--no-esModule \
		--input lib/index.mjs \
		--file $@
	sed -i~ \
		-e "s/require('\([^']*\)');\$$/require("'"\1");/' \
		-e "s/^'\(use strict\)';\$$/"'"\1";/' $@
	rm -f "$@~"


# UMD/Browser-only (filesystem assertions removed)
umd: browser.js
browser.js: lib/*.mjs
	npx rollup \
		--format iife \
		--preferConst \
		--no-esModule \
		--no-freeze \
		--no-interop \
		--name Chinotto \
		--input lib/dom.mjs \
		--intro 'var {Chai} = window;' \
		--external chai \
		--extend window \
		--file $@


# Generate raw coverage data for both Node and browser tests
coverage: dist
	$(ENV) npx nyc mocha --reporter progress

clean:
	rm -rf .nyc_output
	rm -rf test/tmp
	rm -f browser.js index.js index.mjs

lint:
	npx eslint .

report:
	npx nyc --no-clean report

test: test-node test-browser

test-node: cjs
	$(ENV) npx mocha test/filesystem-spec.js test/utils-spec.js

test-browser: browser.js
	$(ENV) npx karma start

.PHONY: coverage clean lint report test
