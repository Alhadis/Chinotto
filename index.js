/**
 * @fileoverview Custom Chai assertions, mainly filesystem-related.
 */
"use strict";

const fs    = require("fs");
const path  = require("path");
const Chai  = require("chai");


/**
 * Assert that two filesystem paths are logically the same.
 * @name      equalPath
 * @memberof! Chai.Assertion.prototype
 * @example   "/bin".should.equalPath("/bin/");
 *            "/bin/../bin".should.equalPath("/bin");
 */
addMethod("equalPath", function(target){
	const subject = String(Chai.util.flag(this, "object"));
	const normalisedSubject = path.normalize(subject);
	const normalisedTarget  = path.normalize(target);
	this.assert(
		normalisedSubject === normalisedTarget,
		`expected path "${subject}" to equal "${target}"`,
		`expected path "${subject}" not to equal "${target}"`,
		normalisedSubject,
		normalisedTarget,
		true
	);
});


/**
 * Assert that a file exists in the filesystem.
 * @name      existOnDisk
 * @alias     existsOnDisk
 * @memberof! Chai.Assertion.prototype
 * @example   "/bin/sh".should.existOnDisk
 *            "<>:*?\0".should.not.existOnDisk
 */
addProperty(["existOnDisk", "existsOnDisk"], function(){
	const subject = Chai.util.flag(this, "object");
	this.assert(
		fs.existsSync(subject),
		`expected "${subject}" to exist in filesystem`,
		`expected "${subject}" not to exist in filesystem`
	);
});


/**
 * Assert that a symbolic link points to the specified file.
 * @name      pointTo
 * @alias     pointingTo
 * @memberof! Chai.Assertion.prototype
 * @example   "/tmp".should.be.a.symlink.pointingTo("/private/tmp");
 */
addMethod(["pointTo", "pointingTo"], function(target){
	const subject  = Chai.util.flag(this, "object");
	Chai.expect(subject).to.be.a.symlink;
	const expected = path.resolve(target);
	const actual   = path.resolve(fs.realpathSync(subject));
	this.assert(
		expected === actual,
		`expected "${subject}" to point to "${expected}"`,
		`expected "${subject}" not to point to "${expected}"`
	);
});


/**
 * Assert that two files have the same inode and device number.
 * @name      hardLink
 * @alias     hardLinkOf
 * @memberof! Chai.Assertion.prototype
 * @example   "/a/huge/file".should.have.hardLink("/same/huge/file");
 *            expect("huge.file").to.be.hardLinkOf("also.huge");
 */
addMethod(["hardLink", "hardLinkOf"], function(target){
	const subject = Chai.util.flag(this, "object");
	Chai.expect(subject).to.existOnDisk;
	Chai.expect(target).to.existOnDisk;
	
	const subjectStats = fs.lstatSync(subject);
	const targetStats  = fs.lstatSync(target);
	
	this.assert(
		subjectStats.ino === targetStats.ino && subjectStats.dev === targetStats.dev,
		`expected "${subject}" to be hard-linked to "${target}"`,
		`expected "${subject}" not to be hard-linked to "${target}"`,
		{device: subjectStats.dev, inode: subjectStats.ino},
		{device: targetStats.dev,  inode: targetStats.ino},
		true
	);
});


/**
 * Assert that subject is a path pointing to a regular file.
 * @name      file
 * @alias     regularFile
 * @memberof! Chai.Assertion.prototype
 * @example   "/bin/sh".should.be.a.file
 *            "/bin".should.not.be.a.file
 */
addProperty(["file", "regularFile"], function(){
	const subject = String(Chai.util.flag(this, "object"));
	Chai.expect(subject).to.existOnDisk;
	this.assert(
		fs.lstatSync(subject).isFile(),
		`expected "${subject}" to be a regular file`,
		`expected "${subject}" not to be a regular file`
	);
});


/**
 * Assert that subject is a path pointing to a directory.
 * @name      directory
 * @memberof! Chai.Assertion.prototype
 * @example   "/bin".should.be.a.directory
 *            "/bin/sh".should.not.be.a.directory
 */
addProperty("directory", function(){
	const subject = String(Chai.util.flag(this, "object"));
	Chai.expect(subject).to.existOnDisk;
	this.assert(
		fs.lstatSync(subject).isDirectory(),
		`expected "${subject}" to be a directory`,
		`expected "${subject}" not to be a directory`
	);
});


/**
 * Assert that subject is a path pointing to a symbolic link.
 * @name      symlink
 * @alias     symbolicLink
 * @memberof! Chai.Assertion.prototype
 * @example   "/usr/local/bin/node".should.be.a.symlink
 */
addProperty(["symlink", "symbolicLink"], function(){
	const subject = String(Chai.util.flag(this, "object"));
	Chai.expect(subject).to.existOnDisk;
	this.assert(
		fs.lstatSync(subject).isSymbolicLink(),
		`expected "${subject}" to be a symbolic link`,
		`expected "${subject}" not to be a symbolic link`
	);
});


/**
 * Assert that subject is a path pointing to a device file.
 *
 * “Device file” refers to either a character device or a block device, making
 * this assertion preferable to {@link blockDevice} and {@link characterDevice}
 * for cross-platform testing.
 *
 * @name      device
 * @alias     deviceFile
 * @memberof! Chai.Assertion.prototype
 * @example   "/dev/zero".should.be.a.device;
 */
addProperty(["device", "deviceFile"], function(){
	const subject = String(Chai.util.flag(this, "object"));
	Chai.expect(subject).to.existOnDisk;
	const stats = fs.lstatSync(subject);
	this.assert(
		stats.isBlockDevice() || stats.isCharacterDevice(),
		`expected "${subject}" to be a character or block device`,
		`expected "${subject}" not to be a character or block device`,
	);
});


/**
 * Assert that subject is a path pointing to a block device.
 * @name      blockDevice
 * @memberof! Chai.Assertion.prototype
 * @example   "/dev/disk0s1".should.be.a.blockDevice
 */
addProperty("blockDevice", function(){
	const subject = String(Chai.util.flag(this, "object"));
	Chai.expect(subject).to.existOnDisk;
	this.assert(
		fs.lstatSync(subject).isBlockDevice(),
		`expected "${subject}" to be a block device`,
		`expected "${subject}" not to be a block device`
	);
});


/**
 * Assert that subject is a path pointing to a character device.
 * @name      characterDevice
 * @alias     charDevice
 * @memberof! Chai.Assertion.prototype
 * @example   "/dev/null".should.be.a.characterDevice
 */
addProperty(["characterDevice", "charDevice"], function(){
	const subject = String(Chai.util.flag(this, "object"));
	Chai.expect(subject).to.existOnDisk;
	this.assert(
		fs.lstatSync(subject).isCharacterDevice(),
		`expected "${subject}" to be a character device`,
		`expected "${subject}" not to be a character device`
	);
});


/**
 * Assert that subject is a path pointing to a FIFO (named pipe).
 * @name      fifo
 * @alias     namedPipe
 * @memberof! Chai.Assertion.prototype
 * @example   "/tmp/154B17E1-2BF7_IN".should.be.a.fifo
 */
addProperty(["fifo", "namedPipe"], function(){
	const subject = String(Chai.util.flag(this, "object"));
	Chai.expect(subject).to.existOnDisk;
	this.assert(
		fs.lstatSync(subject).isFIFO(),
		`expected "${subject}" to be a FIFO`,
		`expected "${subject}" not to be a FIFO`
	);
});


/**
 * Assert that subject is a path pointing to a door.
 * @name      door
 * @memberof! Chai.Assertion.prototype
 * @example   "/system/volatile/syslog_door".should.be.a.door
 * @see       {@link https://en.wikipedia.org/wiki/Doors_(computing)}
 */
addProperty("door", function(){
	const subject = String(Chai.util.flag(this, "object"));
	Chai.expect(subject).to.existOnDisk;
	this.assert(
		0xD000 === (fs.lstatSync(subject).mode & 0xF000),
		`expected "${subject}" to be a door`,
		`expected "${subject}" not to be a door`
	);
});


/**
 * Assert that subject is a path pointing to a socket.
 * @name      socket
 * @memberof! Chai.Assertion.prototype
 * @example   "/run/systemd/private".should.be.a.socket
 */
addProperty("socket", function(){
	const subject = String(Chai.util.flag(this, "object"));
	Chai.expect(subject).to.existOnDisk;
	this.assert(
		fs.lstatSync(subject).isSocket(),
		`expected "${subject}" to be a socket`,
		`expected "${subject}" not to be a socket`
	);
});


/**
 * Variant of {@link Chai.Assertion.addMethod} that supports plugin aliases.
 *
 * @see     {@link https://www.chaijs.com/api/plugins/#addMethod}
 * @example addMethod(["pointTo", "pointingTo"], function(target){ … });
 * @param   {String|String[]} names
 * @param   {Function} fn
 * @return  {void}
 * @internal
 */
function addMethod(names, fn){
	for(const name of "string" === typeof names ? [names] : names)
		Chai.Assertion.addMethod(name, fn);
}


/**
 * Variant of {@link Chai.Assertion.addProperty} that supports plugin aliases.
 *
 * @see     {@link https://www.chaijs.com/api/plugins/#addProperty}
 * @example addProperty(["coloured", "colored"], fn);
 * @param   {String|String[]} names
 * @param   {Function} fn
 * @return  {void}
 * @internal
 */
function addProperty(names, fn){
	for(const name of "string" === typeof names ? [names] : names)
		Chai.Assertion.addProperty(name, fn);
}
