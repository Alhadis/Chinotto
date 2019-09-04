"use strict";

const {AssertionError} = require("chai");

describe("Chinotto", () => {
	before(() => require("../index.js"));
	
	describe(".equalPath", () => {
		it("identifies matching paths",    () => expect("/foo/bar//baz/asdf/quux/..").to.equalPath("/foo/bar/baz/asdf"));
		it("identifies mismatching paths", () => expect("/foo/bar").not.to.equalPath("/foo/baz"));
		it("generates meaningful errors",  () => {
			const fn1 = () => expect("/foo/bar").to.equalPath("/foo/baz");
			const fn2 = () => expect("/foo/bar").not.to.equalPath("/foo//bar");
			expect(fn1).to.throw(AssertionError, 'expected path "/foo/bar" to equal "/foo/baz"');
			expect(fn2).to.throw(AssertionError, 'expected path "/foo/bar" not to equal "/foo//bar"');
		});
		it("chains correctly", () => {
			expect("/foo/bar").to.equalPath("/foo//bar").and.to.equal("/foo/bar");
			expect("/bar/foo").not.to.equalPath("/foo/bar").and.not.to.equal("/foo/bar");
		});
	});
	
	describe(".existOnDisk", () => {
		it("identifies files that exist", () => expect(__filename).to.existOnDisk);
		it("identifies those that don't", () => expect(__filename + ".nah").not.to.existOnDisk);
		
		it("generates meaningful errors", () => {
			const fn1 = () => expect(__filename + ".nah").to.existOnDisk;
			const fn2 = () => expect(__filename).not.to.existOnDisk;
			expect(fn1).to.throw(AssertionError, `expected "${__filename}.nah" to exist in filesystem`);
			expect(fn2).to.throw(AssertionError, `expected "${__filename}" not to exist in filesystem`);
		});
		it("chains correctly", () => {
			expect(__filename).to.existOnDisk.and.equal(__filename);
			expect(__filename + ".nah").not.to.existOnDisk.and.equal(__filename);
		});
	});
});
