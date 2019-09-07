import chai from "chai";
import {normalize, resolve} from "path";
import {addMethod, addProperty} from "./utils.mjs";
import {existsSync, lstatSync, realpathSync, readlinkSync, Stats} from "fs";


export function register(){
	for(const [names, fn] of methods)    addMethod(names, fn);
	for(const [names, fn] of properties) addProperty(names, fn);
}


export const methods = new Map([
	
	/**
	 * Assert that two filesystem paths are logically the same.
	 * @name      equalPath
	 * @memberof! chai.Assertion.prototype
	 * @example   "/bin".should.equalPath("/bin/");
	 *            "/bin/../bin".should.equalPath("/bin");
	 */
	[["equalPath"], function(target){
		const subject = String(chai.util.flag(this, "object"));
		const normalisedSubject = normalize(subject);
		const normalisedTarget  = normalize(target);
		this.assert(
			normalisedSubject === normalisedTarget,
			`expected path "${subject}" to equal "${target}"`,
			`expected path "${subject}" not to equal "${target}"`,
			normalisedSubject,
			normalisedTarget,
			true
		);
	}],
	
	
	/**
	 * Assert that two files have the same inode and device number.
	 * @name      hardLink
	 * @alias     hardLinkOf
	 * @memberof! chai.Assertion.prototype
	 * @example   "/a/huge/file".should.have.hardLink("/same/huge/file");
	 *            expect("huge.file").to.be.hardLinkOf("also.huge");
	 */
	[["hardLink", "hardLinkOf"], function(target){
		const subject = chai.util.flag(this, "object");
		chai.expect(subject).to.existOnDisk;
		chai.expect(target).to.existOnDisk;
		
		const subjectStats = lstatSync(subject);
		const targetStats  = lstatSync(target);
		
		this.assert(
			subjectStats.ino === targetStats.ino && subjectStats.dev === targetStats.dev,
			`expected "${subject}" to be hard-linked to "${target}"`,
			`expected "${subject}" not to be hard-linked to "${target}"`,
			{device: subjectStats.dev, inode: subjectStats.ino},
			{device: targetStats.dev,  inode: targetStats.ino},
			true
		);
	}],


	/**
	 * Assert that a symbolic link points to the specified file.
	 * @name      pointTo
	 * @alias     pointingTo
	 * @memberof! chai.Assertion.prototype
	 * @example   "/tmp".should.be.a.symlink.pointingTo("/private/tmp");
	 */
	[["pointTo", "pointingTo"], function(target){
		const subject  = chai.util.flag(this, "object");
		chai.expect(subject).to.be.a.symlink;
		let realPath;
		try      { realPath = realpathSync(subject); }
		catch(e) { realPath = readlinkSync(subject); }
		const expected = resolve(target);
		const actual   = resolve(realPath);
		this.assert(
			expected === actual,
			`expected "${subject}" to point to "${expected}"`,
			`expected "${subject}" not to point to "${expected}"`
		);
	}],
]);


export const properties = new Map([
	
	/**
	 * Assert that a file exists in the filesystem.
	 * @name      existOnDisk
	 * @alias     existsOnDisk
	 * @memberof! chai.Assertion.prototype
	 * @example   "/bin/sh".should.existOnDisk
	 *            "<>:*?\0".should.not.existOnDisk
	 */
	[["existOnDisk", "existsOnDisk"], function(){
		const subject = chai.util.flag(this, "object");
		let exists;
		try      { exists = lstatSync(subject) instanceof Stats; }
		catch(e) { exists = false; }
		this.assert(
			exists,
			`expected "${subject}" to exist in filesystem`,
			`expected "${subject}" not to exist in filesystem`
		);
	}],
	
	
	/**
	 * Assert that subject is a path pointing to a regular file.
	 * @name      file
	 * @alias     regularFile
	 * @memberof! chai.Assertion.prototype
	 * @example   "/bin/sh".should.be.a.file
	 *            "/bin".should.not.be.a.file
	 */
	[["file", "regularFile"], function(){
		const subject = String(chai.util.flag(this, "object"));
		if(chai.util.flag(this, "negate") && !existsSync(subject)) return;
		chai.expect(subject).to.existOnDisk;
		this.assert(
			lstatSync(subject).isFile(),
			`expected "${subject}" to be a regular file`,
			`expected "${subject}" not to be a regular file`
		);
	}],
	
	
	/**
	 * Assert that subject is a path pointing to a directory.
	 * @name      directory
	 * @memberof! chai.Assertion.prototype
	 * @example   "/bin".should.be.a.directory
	 *            "/bin/sh".should.not.be.a.directory
	 */
	[["directory"], function(){
		const subject = String(chai.util.flag(this, "object"));
		if(chai.util.flag(this, "negate") && !existsSync(subject)) return;
		chai.expect(subject).to.existOnDisk;
		this.assert(
			lstatSync(subject).isDirectory(),
			`expected "${subject}" to be a directory`,
			`expected "${subject}" not to be a directory`
		);
	}],


	/**
	 * Assert that subject is a path pointing to a symbolic link.
	 * @name      symlink
	 * @alias     symbolicLink
	 * @memberof! chai.Assertion.prototype
	 * @example   "/usr/local/bin/node".should.be.a.symlink
	 */
	[["symlink", "symbolicLink"], function(){
		const subject = String(chai.util.flag(this, "object"));
		if(chai.util.flag(this, "negate") && !existsSync(subject)) return;
		chai.expect(subject).to.existOnDisk;
		this.assert(
			lstatSync(subject).isSymbolicLink(),
			`expected "${subject}" to be a symbolic link`,
			`expected "${subject}" not to be a symbolic link`
		);
	}],


	/**
	 * Assert that subject is a path pointing to a device file.
	 *
	 * “Device file” refers to either a character device or a block device, making
	 * this assertion preferable to {@link blockDevice} and {@link characterDevice}
	 * for cross-platform testing.
	 *
	 * @name      device
	 * @alias     deviceFile
	 * @memberof! chai.Assertion.prototype
	 * @example   "/dev/zero".should.be.a.device;
	 */
	[["device", "deviceFile"], function(){
		const subject = String(chai.util.flag(this, "object"));
		if(chai.util.flag(this, "negate") && !existsSync(subject)) return;
		chai.expect(subject).to.existOnDisk;
		const stats = lstatSync(subject);
		this.assert(
			stats.isBlockDevice() || stats.isCharacterDevice(),
			`expected "${subject}" to be a character or block device`,
			`expected "${subject}" not to be a character or block device`,
		);
	}],


	/**
	 * Assert that subject is a path pointing to a block device.
	 * @name      blockDevice
	 * @memberof! chai.Assertion.prototype
	 * @example   "/dev/disk0s1".should.be.a.blockDevice
	 */
	[["blockDevice"], function(){
		const subject = String(chai.util.flag(this, "object"));
		if(chai.util.flag(this, "negate") && !existsSync(subject)) return;
		chai.expect(subject).to.existOnDisk;
		this.assert(
			lstatSync(subject).isBlockDevice(),
			`expected "${subject}" to be a block device`,
			`expected "${subject}" not to be a block device`
		);
	}],


	/**
	 * Assert that subject is a path pointing to a character device.
	 * @name      characterDevice
	 * @alias     charDevice
	 * @memberof! chai.Assertion.prototype
	 * @example   "/dev/null".should.be.a.characterDevice
	 */
	[["characterDevice", "charDevice"], function(){
		const subject = String(chai.util.flag(this, "object"));
		if(chai.util.flag(this, "negate") && !existsSync(subject)) return;
		chai.expect(subject).to.existOnDisk;
		this.assert(
			lstatSync(subject).isCharacterDevice(),
			`expected "${subject}" to be a character device`,
			`expected "${subject}" not to be a character device`
		);
	}],


	/**
	 * Assert that subject is a path pointing to a FIFO (named pipe).
	 * @name      fifo
	 * @alias     namedPipe
	 * @memberof! chai.Assertion.prototype
	 * @example   "/tmp/154B17E1-2BF7_IN".should.be.a.fifo
	 */
	[["fifo", "namedPipe"], function(){
		const subject = String(chai.util.flag(this, "object"));
		if(chai.util.flag(this, "negate") && !existsSync(subject)) return;
		chai.expect(subject).to.existOnDisk;
		this.assert(
			lstatSync(subject).isFIFO(),
			`expected "${subject}" to be a FIFO`,
			`expected "${subject}" not to be a FIFO`
		);
	}],


	/**
	 * Assert that subject is a path pointing to a door.
	 * @name      door
	 * @memberof! chai.Assertion.prototype
	 * @example   "/system/volatile/syslog_door".should.be.a.door
	 * @see       {@link https://en.wikipedia.org/wiki/Doors_(computing)}
	 */
	[["door"], function(){
		const subject = String(chai.util.flag(this, "object"));
		if(chai.util.flag(this, "negate") && !existsSync(subject)) return;
		chai.expect(subject).to.existOnDisk;
		this.assert(
			0xD000 === (lstatSync(subject).mode & 0xF000),
			`expected "${subject}" to be a door`,
			`expected "${subject}" not to be a door`
		);
	}],


	/**
	 * Assert that subject is a path pointing to a socket.
	 * @name      socket
	 * @memberof! chai.Assertion.prototype
	 * @example   "/run/systemd/private".should.be.a.socket
	 */
	[["socket"], function(){
		const subject = String(chai.util.flag(this, "object"));
		if(chai.util.flag(this, "negate") && !existsSync(subject)) return;
		chai.expect(subject).to.existOnDisk;
		this.assert(
			lstatSync(subject).isSocket(),
			`expected "${subject}" to be a socket`,
			`expected "${subject}" not to be a socket`
		);
	}],
]);
