NPM = npm install --quiet --no-save --no-package-lock

all: install lint test


# Install and link development dependencies
install: node_modules

node_modules:
	$(NPM)

node_modules/coveralls:
	$(NPM) coveralls


# Update API reference in readme
docs: README.md

README.md: index.js
	npx jsdoc --explain $^ | node tools/make-docs.js
	


# Check source for errors and style violations
lint:
	npx eslint .


# Submit coverage information to Coveralls.io
coverage: node_modules/coveralls .nyc_output
	npx nyc report --reporter text-lcov | npx coveralls

.nyc_output:
	$(MAKE) test


# Run all unit-tests
test: test-node test-browser
	cd .nyc_output && mv browsers/coverage.json .
	npx nyc report

# Run tests specific to Node.js (or in this case, specific to the filesystem)
test-node:
	npx nyc --silent mocha test/filesystem-spec.js test/utils-spec.js

# Launch a headless browser to run tests that require a DOM
test-browser:
	npx karma start



# Wipe generated coverage data, fixtures, and build-targets
clean:
	rm -rf .nyc_output coverage test/tmp

# As above, but also nuke locally-installed dependencies
clobber: clean
	rm -rf node_modules


# Don't check timestamps if files of these names happen to exist
.PHONY: clean clobber lint test
