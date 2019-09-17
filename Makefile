all: install dist lint test


# Install and link development dependencies
install: node_modules

node_modules:
	ADBLOCK=1 npm install --quiet --no-save --no-package-lock


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
	sed -i~ -f tools/fix-esm.sed $@ && rm -f "$@~"
	dos2unix $@ >/dev/null 2>&1 || true


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
	sed -i~ -f tools/fix-cjs.sed $@ && rm -f "$@~"
	dos2unix $@ >/dev/null 2>&1 || true


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
	sed -i~ -f tools/fix-umd.sed $@ && rm -f "$@~"
	dos2unix $@ >/dev/null 2>&1 || true


# Check source for errors and style violations
lint:
	npx eslint .

# Generate raw coverage data for both Node and browser tests
coverage: dist
	npx nyc mocha --reporter progress

# Display a plain-text summary of code coverage
report:
	npx nyc --no-clean report


# Run all unit-tests
test: test-node test-browser

# Run tests specific to Node.js (or in this case, specific to the filesystem)
test-node: cjs
	npx mocha test/filesystem-spec.js test/utils-spec.js

# Launch a headless browser to run tests that require a DOM
test-browser: browser.js
	npx karma start



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
