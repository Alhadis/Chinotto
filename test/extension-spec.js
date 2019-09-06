"use strict";

const {AssertionError} = require("chai");
const fs   = require("fs");
const path = require("path");


describe("Chinotto", () => {
	const tmp = path.join(__dirname, "tmp");
	
	before("Creating fixture directory", () => fs.existsSync(tmp) || fs.mkdirSync(tmp));
	before("Loading extensions",         () => require("../index.js"));
	after("Emptying fixture directory",  () => {
		for(const file of fs.readdirSync(tmp))
			fs.unlinkSync(path.join(tmp, file));
	});
	
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
		before("Running sanity checks", () => {
			expect(path.isAbsolute(__dirname)).to.be.true;
			expect(path.isAbsolute(__filename)).to.be.true;
		});
		
		it("requires subject to exist", () => {
			const msg = `expected "${__filename}.nah" to exist in filesystem`;
			expect(() => expect(__filename + ".nah")    .to.pointTo("foo")).to.throw(AssertionError, msg);
			expect(() => expect(__filename + ".nah").not.to.pointTo("foo")).to.throw(AssertionError, msg);
		});
		
		it("requires subject to be a symbolic link", () => {
			const msg = `expected "${__filename}" to be a symbolic link`;
			expect(() => expect(__filename)    .to.pointTo("foo")).to.throw(AssertionError, msg);
			expect(() => expect(__filename).not.to.pointTo("foo")).to.throw(AssertionError, msg);
		});
		
		describe("Absolute symlinks", () => {
			const link = path.join(__dirname, "tmp", "absolute.link");
			before("Creating symlink",   () => fs.symlinkSync(__dirname, link));
			before("Validating symlink", () => expect(path.isAbsolute(fs.readlinkSync(link))).to.be.true);
			after("Removing symlink",    () => fs.unlinkSync(link));
			
			it("identifies matching targets",    () => expect(link).to.pointTo(__dirname));
			it("identifies mismatching targets", () => expect(link).not.to.pointTo(__filename));
			it("generates meaningful errors",    () => {
				const fn1 = () => expect(link).to.pointTo(__filename);
				const fn2 = () => expect(link).not.to.pointTo(__dirname);
				expect(fn1).to.throw(AssertionError, `expected "${link}" to point to "${__filename}"`);
				expect(fn2).to.throw(AssertionError, `expected "${link}" not to point to "${__dirname}"`);
			});
		});
		
		describe("Relative symlinks", () => {
			const rightPath = require.resolve("../package.json");
			const wrongPath = path.join(__dirname, "package.json");
			const link      = path.join(__dirname, "tmp", "relative.link");
			
			before("Creating symlink",   () => fs.symlinkSync(path.join("..", "..", "package.json"), link));
			before("Validating symlink", () => expect(path.isAbsolute(fs.readlinkSync(link))).to.be.false);
			after("Removing symlink",    () => fs.unlinkSync(link));
			
			it("identifies matching targets",    () => expect(link).to.pointTo(rightPath));
			it("identifies mismatching targets", () => expect(link).not.to.pointTo(wrongPath));
			it("generates meaningful errors",    () => {
				const fn1 = () => expect(link).to.pointTo(wrongPath);
				const fn2 = () => expect(link).not.to.pointTo(rightPath);
				expect(fn1).to.throw(AssertionError, `expected "${link}" to point to "${wrongPath}"`);
				expect(fn2).to.throw(AssertionError, `expected "${link}" not to point to "${rightPath}"`);
			});
		});
		
		describe("Broken symlinks", () => {
			const link = path.join(__dirname, "tmp", "broken.link");
			before("Creating symlink",   () => fs.symlinkSync(__filename + ".nah", link));
			before("Validating symlink", () => expect(path.isAbsolute(fs.readlinkSync(link))).to.be.true);
			after("Removing symlink",    () => fs.unlinkSync(link));
			
			it("identifies matching targets",    () => expect(link).to.pointTo(__filename + ".nah"));
			it("identifies mismatching targets", () => expect(link).not.to.pointTo(__filename));
			it("generates meaningful errors",    () => {
				const fn1 = () => expect(link).to.pointTo(__filename);
				const fn2 = () => expect(link).not.to.pointTo(__filename + ".nah");
				expect(fn1).to.throw(AssertionError, `expected "${link}" to point to "${__filename}"`);
				expect(fn2).to.throw(AssertionError, `expected "${link}" not to point to "${__filename}.nah"`);
			});
		});
	});
	
	
	"win32" === process.platform || describe(".hardLink", () => {
		let file1, file2;
		before("Creating hard-linked files", () => {
			file1 = path.join(__dirname, "tmp", "file1");
			file2 = path.join(__dirname, "tmp", "file2");
		});
		
		it("identifies hard-linked files", () => {
			fs.writeFileSync(file1, "XYZ", "utf8");
			fs.linkSync(file1, file2);
			expect(file1).to.hardLink(file2);
			expect(file2).to.hardLink(file1);
			expect(file1).not.to.hardLink(__filename);
			expect(file2).not.to.hardLink(__filename);
		});
		
		it("supports `.hardLinkOf` as an alias", () => {
			expect(file1).to.be.a.hardLinkOf(file2);
			expect(file2).to.be.a.hardLinkOf(file1);
			expect(file1).not.to.be.a.hardLinkOf(__filename);
			expect(file2).not.to.be.a.hardLinkOf(__filename);
		});
	});
	
	
	describe(".file", () => {
		it("identifies matching filetypes",    () => expect(__filename).to.be.a.file);
		it("identifies mismatching filetypes", () => expect(__dirname).not.to.be.a.file);
		it("identifies non-existent entities", () => expect(__filename + ".nah").not.to.be.a.file);
		it("generates meaningful errors",      () => {
			const fn1 = () => expect(__dirname).to.be.a.file;
			const fn2 = () => expect(__filename).not.to.be.a.file;
			const fn3 = () => expect(__filename + ".nah").to.be.a.file;
			expect(fn1).to.throw(AssertionError, `expected "${__dirname}" to be a regular file`);
			expect(fn2).to.throw(AssertionError, `expected "${__filename}" not to be a regular file`);
			expect(fn3).to.throw(AssertionError, `expected "${__filename}.nah" to exist in filesystem`);
		});
		it("supports `.regularFile` as an alias", () => {
			expect(__filename).to.be.a.regularFile;
			expect(__filename + ".nah").not.to.be.a.regularFile;
			expect(__dirname).not.to.be.a.regularFile;
		});
	});
	
	
	describe(".directory", () => {
		it("identifies matching filetypes",    () => expect(__dirname).to.be.a.directory);
		it("identifies mismatching filetypes", () => expect(__filename).not.to.be.a.directory);
		it("identifies non-existent entities", () => expect(__dirname + ".nah").not.to.be.a.directory);
		it("generates meaningful errors",      () => {
			const fn1 = () => expect(__filename).to.be.a.directory;
			const fn2 = () => expect(__dirname).not.to.be.a.directory;
			const fn3 = () => expect(__dirname + ".nah").to.be.a.directory;
			expect(fn1).to.throw(AssertionError, `expected "${__filename}" to be a directory`);
			expect(fn2).to.throw(AssertionError, `expected "${__dirname}" not to be a directory`);
			expect(fn3).to.throw(AssertionError, `expected "${__dirname}.nah" to exist in filesystem`);
		});
	});
	
	
	describe(".symlink", () => {
		const unbrokenLink = path.join(__dirname, "tmp", "unbroken.link");
		const brokenLink   = path.join(__dirname, "tmp", "broken.link");
		
		before("Creating symlinks", () => {
			fs.symlinkSync(__filename, unbrokenLink);
			fs.symlinkSync(__filename + ".nah", brokenLink);
			expect(fs.readlinkSync(unbrokenLink)).to.equal(__filename);
			expect(fs.readlinkSync(brokenLink))  .to.equal(__filename + ".nah");
		});
		after("Removing symlinks", () => {
			fs.unlinkSync(unbrokenLink);
			fs.unlinkSync(brokenLink);
		});
		
		it("identifies matching filetypes",    () => expect(unbrokenLink).to.be.a.symlink);
		it("identifies mismatching filetypes", () => expect(__filename).not.to.be.a.symlink);
		it("identifies non-existent entities", () => expect(__filename + ".nah").not.to.be.a.symlink);
		it("identifies broken symlinks",       () => expect(brokenLink).to.be.a.symlink);
		it("generates meaningful errors",      () => {
			const fn1 = () => expect(__filename).to.be.a.symlink;
			const fn2 = () => expect(unbrokenLink).not.to.be.a.symlink;
			const fn3 = () => expect(unbrokenLink + ".nah").to.be.a.symlink;
			expect(fn1).to.throw(AssertionError, `expected "${__filename}" to be a symbolic link`);
			expect(fn2).to.throw(AssertionError, `expected "${unbrokenLink}" not to be a symbolic link`);
			expect(fn3).to.throw(AssertionError, `expected "${unbrokenLink}.nah" to exist in filesystem`);
		});
		it("supports `.symbolicLink` as an alias", () => {
			expect(unbrokenLink).to.be.a.symbolicLink;
			expect(unbrokenLink + ".nah").not.to.be.a.symbolicLink;
			expect(brokenLink).to.be.a.symbolicLink;
		});
	});
});
