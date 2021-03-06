(function(global, factory){ /* istanbul ignore next */
	"object" === typeof exports && "undefined" !== typeof module
		? module.exports = factory(require("chai"), require("path"), require("fs"))
		: "function" === typeof define && define.amd
			? define(["chai", "path", "fs"], factory)
			: (global = global || self, global.Chinotto = factory(global.chai, global.path, global.fs));
}(this, (chai, path, fs) => {
	/**
	 * @module Chinotto
	 */
	"use strict";
	
	const {hasOwnProperty} = Object.prototype;


	/**
	 * Named exports provided by the library's entry-point.
	 * @namespace Chinotto.Exports
	 * @property {Object} chai - Reference to the Chai module used by Chinotto.
	 * @property {Map<String[], Function>} methods - Handler functions for assertion methods, keyed by name(s)
	 * @property {Map<String[], Function>} properties - Handler functions for assertion properties, keyed by name(s)
	 * @extends Chinotto.Utils
	 */

	/**
	 * Assertion methods added to Chai's chainable DSL by {@link #register}.
	 * @namespace Chinotto.Methods
	 * @see {@link https://www.chaijs.com/api/plugins/#method_addmethod}
	 */

	/**
	 * Assertion properties added to Chai's chainable DSL by {@link #register}.
	 * @namespace Chinotto.Properties
	 * @see {@link https://www.chaijs.com/api/plugins/#method_addproperty}
	 */

	/**
	 * Auxiliary helper functions for defining new Chai extensions.
	 * @namespace Chinotto.Utils
	 */


	/**
	 * Variant of {@link chai.Assertion.addMethod} that supports plugin aliases.
	 *
	 * If the property already exists on the prototype, it will not be overwritten.
	 * To redefine existing methods and prototypes, use {@link chai.util.addMethod}
	 * or {@link chai.util.overwriteMethod}.
	 *
	 * @name    module:Chinotto.Utils.addMethod
	 * @see     {@link https://www.chaijs.com/api/plugins/#addMethod}
	 * @example addMethod(["pointTo", "pointingTo"], function(target){ … });
	 * @param   {String|String[]} names
	 * @param   {Function} fn
	 * @return  {void}
	 */
	function addMethod(names, fn){
		for(const name of "string" === typeof names ? [names] : names){
			if(hasOwnProperty.call(chai.Assertion.prototype, name)) continue;
			chai.Assertion.addMethod(name, fn);
		}
	}


	/**
	 * Variant of {@link chai.Assertion.addProperty} that supports plugin aliases.
	 *
	 * @name    module:Chinotto.Utils.addProperty
	 * @see     {@link https://www.chaijs.com/api/plugins/#addProperty}
	 * @example addProperty(["coloured", "colored"], fn);
	 * @param   {String|String[]} names
	 * @param   {Function} fn
	 * @return  {void}
	 */
	function addProperty(names, fn){
		for(const name of "string" === typeof names ? [names] : names){
			if(hasOwnProperty.call(chai.Assertion.prototype, name)) continue;
			chai.Assertion.addProperty(name, fn);
		}
	}


	/**
	 * Variant of {@link defineAssertions} that defines only one assertion.
	 *
	 * @name  module:Chinotto.Utils.defineAssertion
	 * @param {String|String[]} names
	 * @param {Function} handler
	 * @return {void}
	 */
	function defineAssertion(names, handler){
		names = flattenList(names).join(", ");
		return defineAssertions({[names]: handler});
	}


	/**
	 * Wrapper for defining simple custom Chai assertions.
	 *
	 * @name module:Chinotto.Utils.defineAssertions
	 * @param {Object} spec
	 * @example <caption>Defining a "colour" assertion</caption>
	 *    // Typical definition:
	 *    defineAssertions({
	 *       ["colour, coloured"](subject, expected){
	 *           const actual = subject.colour;
	 *           this.assert(
	 *               actual === expected,
	 *               "expected #{this} to be coloured #{exp}",
	 *               "expected #{this} not to be coloured #{exp}",
	 *               expected,
	 *               actual
	 *           );
	 *       },
	 *    });
	 *
	 *    // Usage:
	 *    expect({colour: 0xFF0000}).to.have.colour(0xFF0000);
	 *    expect({colour: "red"}).not.to.be.coloured("green");
	 *
	 * @example <caption>Shorthand for the above</caption>
	 *    defineAssertions({
	 *       ["colour, coloured"](subject, expected){
	 *           return [
	 *               subject.colour === expected,
	 *               "to be coloured #{exp}",
	 *           ];
	 *       },
	 *    });
	 *
	 * @todo Elaborate on examples further; they're still confusing.
	 * @see {@link http://chaijs.com/api/plugins/#method_addmethod}
	 * @return {void}
	 */
	function defineAssertions(spec){
		for(let [names, handler] of Object.entries(spec)){
			const fn = function(...args){
				const subject = chai.util.flag(this, "object");
				const results = handler.call(this, subject, ...args);
				if(!Array.isArray(results)) return;
				if(2 === results.length && "string" === typeof results[1]){
					const suffix = results[1].trim();
					results[1] = `expected #{this} ${suffix}`;
					results[2] = `expected #{this} not ${suffix}`;
				}
				if(args.length > 0){
					const tag = /#{(?:exp|act)}/;
					if(results.length < 4 && (tag.test(results[1]) || tag.test(results[2])))
						results.push(args[0], results[0]);
				}
				this.assert(...results);
			};
			names = [...new Set(names.trim().split(/[,\s]+/g).filter(Boolean))];
			for(const name of names)
				handler.length < 2
					? addProperty(name, fn)
					: addMethod(name, fn);
		}
	}


	/**
	 * "Flatten" a (possibly nested) list of strings into a single-level array.
	 *
	 * Strings are split by whitespace as separate elements of the final array.
	 *
	 * @private
	 * @name module:Chinotto.Utils.flattenList
	 * @param {Array|String} input
	 * @param {WeakSet} [refs=null]
	 * @return {String[]} An array of strings
	 */
	function flattenList(input, refs = null){
		refs = refs || new WeakSet();
		input = "string" === typeof input
			? [input.trim()]
			: refs.add(input) && Array.from(input).slice();
		
		const output = [];
		for(const value of input){
			if(!value) continue;
			switch(typeof value){
				case "object":
					if(refs.has(value)) continue;
					refs.add(value);
					output.push(...flattenList(value, refs));
					break;
				default:
					output.push(...String(value).trim().split(/\s+/));
			}
		}
		return output;
	}


	/**
	 * Format a list of strings for human-readable output.
	 *
	 * @private
	 * @name module:Chinotto.Utils.formatList
	 * @example
	 *    formatList(["A", "B"])            == '"A" and "B"';
	 *    formatList(["A", "B", "C"])       == '"A", "B" and "C"';
	 *    formatList(["A", "B", "C"], "or") == '"A", "B" or "C"';
	 *
	 * @param {String[]} list
	 * @param {String} [rel="and"]
	 * @param {Boolean} [oxfordComma=false]
	 * @return {String}
	 */
	function formatList(list, rel = "and", oxfordComma = false){
		const inspect = input => JSON.stringify(input);
		list = [...list];
		if(list.length > 1){
			list = list.map(inspect);
			const last = list.pop();
			return list.join(", ")
				+ (oxfordComma && list.length > 1 ? "," : "")
				+ ` ${rel} ${last}`;
		}
		else{
			list = list.map(inspect).join(", ") || '""';
			return list;
		}
	}
	
	
	/**
	 * Register every available Chai extension.
	 *
	 * @name module:Chinotto.Utils.register
	 * @example
	 *    import Chinotto from "./lib/index.mjs";
	 *    Chinotto.register();
	 * @return {Object}
	 */
	function register(){
		for(const [names, fn] of methods)    addMethod(names, fn);
		for(const [names, fn] of properties) addProperty(names, fn);
		return this;
	}
	
	
	const methods = new Map([
		
		/**
		 * Check if an {@link HTMLElement} contains one or more CSS classes.
		 *
		 * @name     module:Chinotto.Methods.class
		 * @alias    classes
		 * @param    {...(String|String[])} expected - An array or whitespace-delimited list of CSS class-names
		 * @example  document.body.should.have.class("content");
		 *           expect($(".btn.large")).to.have.classes("btn", "large");
		 */
		[["class", "classes"], function(...expected){
			const any     = chai.util.flag(this, "any");
			let subjects  = chai.util.flag(this, "object");
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
		}],
		
		
		/**
		 * Assert that two filesystem paths are logically the same.
		 *
		 * @name      module:Chinotto.Methods.equalPath
		 * @param     {String} target
		 * @example   "/bin".should.equalPath("/bin/");
		 *            "/bin/../bin".should.equalPath("/bin");
		 */
		[["equalPath"], function(target){
			const subject = String(chai.util.flag(this, "object"));
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
		}],
		
		
		/**
		 * Assert that two files have the same inode and device number.
		 *
		 * @name      module:Chinotto.Methods.hardLink
		 * @alias     hardLinkOf
		 * @param     {String} target
		 * @example   "/a/huge/file".should.have.hardLink("/same/huge/file");
		 *            expect("huge.file").to.be.hardLinkOf("also.huge");
		 */
		[["hardLink", "hardLinkOf"], function(target){
			const subject = chai.util.flag(this, "object");
			chai.expect(subject).to.existOnDisk;
			chai.expect(target).to.existOnDisk;
			
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
		}],


		/**
		 * Assert that a symbolic link points to the specified file.
		 *
		 * @name      module:Chinotto.Methods.pointTo
		 * @alias     pointingTo
		 * @param     {String} target
		 * @example   "/tmp".should.be.a.symlink.pointingTo("/private/tmp");
		 */
		[["pointTo", "pointingTo"], function(target){
			const subject  = chai.util.flag(this, "object");
			chai.expect(subject).to.be.a.symlink;
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
		}],
	]);


	const properties = new Map([
		
		/**
		 * Assert that an {@link HTMLElement} is rendered in the DOM tree.
		 *
		 * @name      module:Chinotto.Properties.drawn
		 * @example   document.body.should.be.drawn;
		 *            document.head.should.not.be.drawn;
		 */
		[["drawn"], function(){
			let subject = chai.util.flag(this, "object");
			if(subject.jquery)
				subject = subject[0];
			
			const bounds = subject.getBoundingClientRect();
			const {top, right, bottom, left} = bounds;
			
			this.assert(
				right - left > 0 || bottom - top > 0,
				"expected element to be drawn",
				"expected element not to be drawn"
			);
		}],
		
		
		/**
		 * Assert that an {@link HTMLElement} has user focus, or contains something which does.
		 *
		 * @name      module:Chinotto.Properties.focus
		 * @example   document.activeElement.should.have.focus;
		 *            document.createElement("div").should.not.have.focus;
		 */
		[["focus"], function(){
			const ae = document.activeElement;
			
			let subject = chai.util.flag(this, "object");
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
		}],
		
		
		/**
		 * Assert that subject is a path pointing to an executable.
		 *
		 * @name module:Chinotto.Properties.executable
		 * @description
		 *    NOTE: This assertion tests two very different things, depending on the
		 *    currently-running platform. On Unix-like systems, the mode of the file's
		 *    lstat(2) is bitmasked against `0o111` to extract the executable bits:
		 *
		 * @example <caption>POSIX systems</caption>
		 *    "/usr/local/bin/node".should.be.executable; // lrwxr-xr-x
		 *    "./doc/README.md".should.not.be.executable; // -rw-r--r--
		 *
		 * @description
		 *    Because Windows has no concept of permission bits, the `PATHEXT` environment
		 *    variable is checked instead. If the subject string ends with an executable file
		 *    extension (or would if one was added), the assertion passes.
		 *
		 * @example <caption>Windows systems</caption>
		 *    "C:\\Program Files\\nodejs\\node"     .should.be.executable;
		 *    "C:\\Program Files\\nodejs\\node.exe" .should.be.executable;
		 *    "C:\\Program Files\\nodejs\\README.md".should.not.be.executable;
		 */
		[["executable"], function(){
			const subject = String(chai.util.flag(this, "object"));
			const negated = chai.util.flag(this, "negate");
			const exists  = fs.existsSync(subject);
			
			// Windows
			if("win32" === process.platform){
				// Normalise capitalisation; Windows environment variables are case-insensitive.
				const env = Object.create(null);
				for(const key in process.env)
					env[key.toUpperCase()] = process.env[key];
				
				const exts = (env.PATHEXT || ".COM;.EXE;.BAT;.CMD").toLowerCase().split(";").filter(Boolean);
				
				// Filepath exists
				if(exists){
					const stats = fs.lstatSync(subject);
					const ext   = path.extname(subject).toUpperCase();
					
					// ... but it's a directory, not a file or symlink
					if(stats.isDirectory()){
						if(!negated) return;
						throw new TypeError(`expected "${subject}" to be a file or symbolic link`);
					}
					
					// Filename ends with an executable extension; valid
					else if(exts.includes(ext)) return;
					
					// Filename *doesn't* end with an executable extension, but another file in this directory might
					else{
						const dir  = path.dirname(subject);
						const ents = fs.readdirSync(dir).map(name => path.join(dir, name.toLowerCase()));
						console.log(ents);
					}
				}
			}
			
			// POSIX
			else{
				if(negated && !exists) return;
				this.assert(
					!!(0o111 & fs.lstatSync(subject).mode),
					`expected "${subject}" to be executable`,
					`expected "${subject}" not to be executable`
				);
			}
		}],
		
	
		/**
		 * Assert that a file exists in the filesystem.
		 *
		 * @name      module:Chinotto.Properties.existOnDisk
		 * @alias     existsOnDisk
		 * @example   "/bin/sh".should.existOnDisk
		 *            "<>:*?\0".should.not.existOnDisk
		 */
		[["existOnDisk", "existsOnDisk"], function(){
			const subject = chai.util.flag(this, "object");
			let exists;
			try      { exists = fs.lstatSync(subject) instanceof fs.Stats; }
			catch(e) { exists = false; }
			this.assert(
				exists,
				`expected "${subject}" to exist in filesystem`,
				`expected "${subject}" not to exist in filesystem`
			);
		}],
		
		
		/**
		 * Assert that subject is a path pointing to a regular file.
		 *
		 * @name      module:Chinotto.Properties.file
		 * @alias     regularFile
		 * @example   "/bin/sh".should.be.a.file
		 *            "/bin".should.not.be.a.file
		 */
		[["file", "regularFile"], function(){
			const subject = String(chai.util.flag(this, "object"));
			if(chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
			chai.expect(subject).to.existOnDisk;
			this.assert(
				fs.lstatSync(subject).isFile(),
				`expected "${subject}" to be a regular file`,
				`expected "${subject}" not to be a regular file`
			);
		}],
		
		
		/**
		 * Assert that subject is a path pointing to a directory.
		 *
		 * @name      module:Chinotto.Properties.directory
		 * @example   "/bin".should.be.a.directory
		 *            "/bin/sh".should.not.be.a.directory
		 */
		[["directory"], function(){
			const subject = String(chai.util.flag(this, "object"));
			if(chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
			chai.expect(subject).to.existOnDisk;
			this.assert(
				fs.lstatSync(subject).isDirectory(),
				`expected "${subject}" to be a directory`,
				`expected "${subject}" not to be a directory`
			);
		}],


		/**
		 * Assert that subject is a path pointing to a symbolic link.
		 *
		 * @name      module:Chinotto.Properties.symlink
		 * @alias     symbolicLink
		 * @example   "/usr/local/bin/node".should.be.a.symlink
		 */
		[["symlink", "symbolicLink"], function(){
			const subject = String(chai.util.flag(this, "object"));
			if(chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
			chai.expect(subject).to.existOnDisk;
			this.assert(
				fs.lstatSync(subject).isSymbolicLink(),
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
		 * @name      module:Chinotto.Properties.device
		 * @alias     deviceFile
		 * @example   "/dev/zero".should.be.a.device;
		 */
		[["device", "deviceFile"], function(){
			const subject = String(chai.util.flag(this, "object"));
			if(chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
			chai.expect(subject).to.existOnDisk;
			const stats = fs.lstatSync(subject);
			this.assert(
				stats.isBlockDevice() || stats.isCharacterDevice(),
				`expected "${subject}" to be a character or block device`,
				`expected "${subject}" not to be a character or block device`,
			);
		}],


		/**
		 * Assert that subject is a path pointing to a block device.
		 *
		 * @name      module:Chinotto.Properties.blockDevice
		 * @example   "/dev/disk0s1".should.be.a.blockDevice
		 */
		[["blockDevice"], function(){
			const subject = String(chai.util.flag(this, "object"));
			if(chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
			chai.expect(subject).to.existOnDisk;
			this.assert(
				fs.lstatSync(subject).isBlockDevice(),
				`expected "${subject}" to be a block device`,
				`expected "${subject}" not to be a block device`
			);
		}],


		/**
		 * Assert that subject is a path pointing to a character device.
		 *
		 * @name      module:Chinotto.Properties.characterDevice
		 * @alias     charDevice
		 * @example   "/dev/null".should.be.a.characterDevice
		 */
		[["characterDevice", "charDevice"], function(){
			const subject = String(chai.util.flag(this, "object"));
			if(chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
			chai.expect(subject).to.existOnDisk;
			this.assert(
				fs.lstatSync(subject).isCharacterDevice(),
				`expected "${subject}" to be a character device`,
				`expected "${subject}" not to be a character device`
			);
		}],


		/**
		 * Assert that subject is a path pointing to a FIFO (named pipe).
		 *
		 * @name      module:Chinotto.Properties.fifo
		 * @alias     namedPipe
		 * @example   "/tmp/154B17E1-2BF7_IN".should.be.a.fifo
		 */
		[["fifo", "namedPipe"], function(){
			const subject = String(chai.util.flag(this, "object"));
			if(chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
			chai.expect(subject).to.existOnDisk;
			this.assert(
				fs.lstatSync(subject).isFIFO(),
				`expected "${subject}" to be a FIFO`,
				`expected "${subject}" not to be a FIFO`
			);
		}],


		/**
		 * Assert that subject is a path pointing to a door.
		 *
		 * @name      module:Chinotto.Properties.door
		 * @example   "/system/volatile/syslog_door".should.be.a.door
		 * @see       {@link https://en.wikipedia.org/wiki/Doors_(computing)}
		 */
		[["door"], function(){
			const subject = String(chai.util.flag(this, "object"));
			if(chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
			chai.expect(subject).to.existOnDisk;
			this.assert(
				0xD000 === (fs.lstatSync(subject).mode & 0xF000),
				`expected "${subject}" to be a door`,
				`expected "${subject}" not to be a door`
			);
		}],


		/**
		 * Assert that subject is a path pointing to a socket.
		 *
		 * @name      module:Chinotto.Properties.socket
		 * @example   "/run/systemd/private".should.be.a.socket
		 */
		[["socket"], function(){
			const subject = String(chai.util.flag(this, "object"));
			if(chai.util.flag(this, "negate") && !fs.existsSync(subject)) return;
			chai.expect(subject).to.existOnDisk;
			this.assert(
				fs.lstatSync(subject).isSocket(),
				`expected "${subject}" to be a socket`,
				`expected "${subject}" not to be a socket`
			);
		}],
	]);
	
	return {
		chai,
		methods,
		properties,
		addMethod,
		addProperty,
		defineAssertion,
		defineAssertions,
		flattenList,
		formatList,
		register,
	};
}));
