all: lint coverage test report

coverage:
	(npx nyc mocha --reporter min 2>&1) >/dev/null

clean:
	rm -rf .nyc_output
	rm -rf test/tmp

lint:
	npx eslint .

report:
	npx nyc --no-clean report

test: test-node test-browser

test-node:
	npx mocha test/filesystem-spec.js test/utils-spec.js

test-browser:
	npx karma start

.PHONY: coverage clean lint report test
