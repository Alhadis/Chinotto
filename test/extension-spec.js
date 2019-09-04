"use strict";

const {AssertionError} = require("chai");
const fs   = require("fs");
const path = require("path");


describe("Chinotto", () => {
	const tmp = path.join(__dirname, "tmp");
	
	before(() => fs.existsSync(tmp) || fs.mkdirSync(tmp));
	before(() => require("../index.js"));
	after(() => fs.readdirSync(tmp).forEach(file =>
		fs.unlinkSync(path.join(tmp, file))));
	
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
	
	describe(".pointTo", () => {
		it("resolves absolute symbolic links", () => {
			const link = path.join(__dirname, "tmp", "absolute.link");
			expect(path.isAbsolute(__dirname)).to.be.true; // Sanity check
			fs.symlinkSync(__dirname, link);
			expect(path.isAbsolute(fs.readlinkSync(link))).to.be.true;
			expect(link).to.pointTo(__dirname);
			expect(link).not.to.pointTo(__filename);
		});
		
		it("resolves relative symbolic links", () => {
			const link = path.join(__dirname, "tmp", "relative.link");
			fs.symlinkSync(path.join("..", "..", "package.json"), link);
			expect(path.isAbsolute(fs.readlinkSync(link))).to.be.false;
			expect(link).to.pointTo(require.resolve("../package.json"));
			expect(link).not.to.pointTo(path.join(__dirname, "package.json"));
		});
		
		it("resolves broken symbolic links", () => {
			const link = path.join(__dirname, "tmp", "broken.link");
			fs.symlinkSync(__filename + ".nah", link);
			expect(link).to.pointTo(__filename + ".nah");
			expect(link).not.to.pointTo(__filename);
		});
	});
});
