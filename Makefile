ENV = NODE_OPTIONS='--experimental-modules'

all: dist lint coverage test report


# Generate a bundle in each module flavour we care about
dist: esm cjs umd


# ECMAScript modules
esm: index.mjs
index.mjs: lib/*.mjs
	@ printf '==> Bundling: %s\n' "$@"
	npx rollup \
		--format esm \
		--preferConst \
		--input lib/index.mjs \
		--file $@
	sed -i~ -e "/^import .* from '[^']*';$$/ s/'\([^']*\)';/"'"\1";/' $@ && rm -f "$@~"


# CommonJS/Node.js modules
cjs: index.js
index.js: lib/*.mjs
	@ printf '==> Bundling: %s\n' "$@"
	npx rollup \
		--format cjs \
		--preferConst \
		--no-freeze \
		--no-interop \
		--no-esModule \
		--input lib/index.mjs \
		--file $@
	sed -i~ -e "\
		s/require('\([^']*\)');"'$$/require("\1");/; \
		s/^'"'use strict';"'$$/"use strict";/; \
	' $@ && rm -f "$@~"


# UMD/Browser-only (filesystem assertions removed)
umd: browser.js
browser.js: lib/*.mjs
	@ printf '==> Bundling: %s\n' "$@"
	npx rollup \
		--format iife \
		--preferConst \
		--no-esModule \
		--no-interop \
		--name Chinotto \
		--input lib/dom.mjs \
		--globals chai:chai \
		--external chai \
		--extend window \
		--file $@
	sed -i~ -e '\
		s/^(function *(exports, chai) *{$$/(function(exports, chai){/; \
		s/'\'use\ strict\'';$$/"use strict";/; \
		/^}(/ s/,[[:blank:]]*chai));$$/, this.chai));/; \
	' $@ && rm -f "$@~"


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
