"use strict";

const fs    = require("fs");
const path  = require("path");
const Chai  = require("chai");

const {
	addMethod,
	addProperty,
	flattenList,
	formatList,
} = require("./utils.js");


/**
 * Check if an {@link HTMLElement} contains one or more CSS classes.
 * @name      class
 * @alias     classes
 * @memberof! Chai.Assertion.prototype
 * @example   document.body.should.have.class("content");
 *            expect($(".btn.large")).to.have.classes("btn", "large");
 */
addMethod(["class", "classes"], function(...expected){
	const any     = Chai.util.flag(this, "any");
	let subjects  = Chai.util.flag(this, "object");
	subjects      = "length" in subjects ? Array.from(subjects) : [subjects];
	expected      = flattenList(expected);
	
	for(const {classList, className} of subjects){
		let matched = expected.filter(name =>  classList.contains(name));
		let missing = expected.filter(name => !classList.contains(name));
		const value = any ? matched.length : !missing.length;
		const names = classList.length ? `classList "${className}"` : "empty classList";
		missing     = formatList(expected.filter(n => missing.includes(n)), any ? "or" : "and");
		matched     = formatList(expected.filter(n => matched.includes(n)), any ? "or" : "and");
		
		this.assert(
			value,
			`expected ${names} to include ${missing}`,
			`expected ${names} not to include ${matched}`,
			expected.join(" "),
			className
		);
	}
});


/**
 * Assert that an {@link HTMLElement} is rendered in the DOM tree.
 * @name      drawn
 * @memberof! Chai.Assertion.prototype
 * @example   document.body.should.be.drawn;
 *            document.head.should.not.be.drawn;
 */
addProperty("drawn", function(){
	let subject = Chai.util.flag(this, "object");
	if(subject.jquery)
		subject = subject[0];
	
	const bounds = subject.getBoundingClientRect();
	const {top, right, bottom, left} = bounds;
	
	this.assert(
		right - left > 0 || bottom - top > 0,
		"expected element to be drawn",
		"expected element not to be drawn"
	);
});


/**
 * Assert that an {@link HTMLElement} has user focus, or contains something which does.
 * @name      focus
 * @memberof! Chai.Assertion.prototype
 * @example   document.activeElement.should.have.focus;
 *            document.createElement("div").should.not.have.focus;
 */
addProperty("focus", function(){
	const ae = document.activeElement;
	
	let subject = Chai.util.flag(this, "object");
	if(subject.jquery)
		subject = subject[0];
	
	if(subject instanceof HTMLElement)
		this.assert(
			ae === subject || ae.contains(subject),
			"expected element to have focus",
			"expected element not to have focus"
		);
	
	else if(subject.element instanceof HTMLElement)
		this.assert(
			ae === subject.element || ae.contains(subject.element),
			"expected #{this} to have focus",
			"expected #{this} not to have focus"
		);
	
	else throw new TypeError("subject is not an HTMLElement or component-like object");
});


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
	let exists;
	try      { exists = fs.lstatSync(subject) instanceof fs.Stats; }
	catch(e) { exists = false; }
	this.assert(
		exists,
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
	let realPath;
	try      { realPath = fs.realpathSync(subject); }
	catch(e) { realPath = fs.readlinkSync(subject); }
	const expected = path.resolve(target);
	const actual   = path.resolve(realPath);
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
	if(Chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
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
	if(Chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
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
	if(Chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
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
	if(Chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
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
	if(Chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
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
	if(Chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
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
	if(Chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
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
	if(Chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
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
	if(Chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
	Chai.expect(subject).to.existOnDisk;
	this.assert(
		fs.lstatSync(subject).isSocket(),
		`expected "${subject}" to be a socket`,
		`expected "${subject}" not to be a socket`
	);
});
