ENV = NODE_OPTIONS='--experimental-modules'
NPM = ADBLOCK=1 npm install --quiet --no-save --no-package-lock

all: install dist lint test


# Install and link development dependencies
install: node_modules node_modules/jg

node_modules:; $(NPM)

# Handle jg(1) specially, since a stable version's not published yet
# - FIXME: Remove these tasks once our current mess of projects is sorted
node_modules/jg:
	git clone https://github.com/Alhadis/JG.git $@
	cd $@ && git checkout b5bdbe5 && npm install .
	rm -rf 'node_modules/@alhadis/eslint-config'
	ln -s ../jg/eslint 'node_modules/@alhadis/eslint-config'
	ln -s jg/node_modules/eslint-plugin-import node_modules


# Generate a bundle in each module flavour we care about
dist: esm cjs umd


# ECMAScript modules
esm: index.mjs
index.mjs: lib/*.mjs
	@ printf '==> Bundling: %s\n' "$@"
	npx rollup \
		--silent \
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
		--silent \
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
		--silent \
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


# Check source for errors and style violations
lint:
	npx eslint .

# Generate raw coverage data for both Node and browser tests
coverage: dist
	$(ENV) npx nyc mocha --reporter progress

# Display a plain-text summary of code coverage
report:
	npx nyc --no-clean report


# Run all unit-tests
test: test-node test-browser

# Run tests specific to Node.js (or in this case, specific to the filesystem)
test-node: cjs
	$(ENV) npx mocha test/filesystem-spec.js test/utils-spec.js

# Launch a headless browser to run tests that require a DOM
test-browser: browser.js
	$(ENV) npx karma start



# Wipe generated coverage data, fixtures, and build-targets
clean:
	rm -rf .nyc_output
	rm -rf test/tmp
	rm -f browser.js index.js index.mjs

# As above, but also nuke locally-installed dependencies
clobber: clean
	rm -rf node_modules


# Don't check timestamps if files of these names happen to exist
.PHONY: coverage clean clobber lint report test
