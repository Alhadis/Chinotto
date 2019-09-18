<!--*- tab-width: 4; indent-tabs-mode: t; -*- vim:set ts=4 noet:-->

Chinotto: Custom assertions for [Chai.js](https://www.chaijs.com)
=================================================================
<img align="right" width="150"
	src="https://raw.githubusercontent.com/Alhadis/Chinotto/5b401729bc004dd6066/chinotto.png"
	title="Image source: http://www.citrustogrow.com.au/product/chinotto-orange/" />

[![Build status: TravisCI][TravisCI-badge]][TravisCI-link]
[![Build status: AppVeyor][AppVeyor-badge]][AppVeyor-link]
[![Coverage status][Coverage-badge]][Coverage-link]


Compilation of useful Chai assertions that I've written over time,
migrated from the test-suites of various projects ([`atom-mocha`][]
in particular).


*“Uh, why did you name thi-”*
-----------------------------
Because if Chai and Mocha proved anything, it's that beverages make
memorable library names. Also, I enjoy Chinotto and the name on NPM
was available, so I took it. *Superalo*.


Usage
-----

1.	Add `chinotto` to your project's `devDependencies`:
	~~~console
	$ npm install --save-dev chinotto
	~~~

2.	Then call the [`register()`][] function it exports:
	~~~js
	require("chinotto").register();
	~~~

	This automatically registers every available extension with Chai,
	which are used like any other [BDD-style assertion](https://chaijs.com/api/bdd/):

	~~~js
	expect(__filename).to.be.a.file.and.to.existOnDisk;
	__dirname.should.be.a.file.and.equalPath(__dirname + "/");
	~~~

	Alternatively, you can just import `chinotto/register` instead.
	This calls [`register()`] for you automatically, and makes `Chinotto` globally available:

	~~~js
	require("chinotto/register");

	// Define a hypothetical extension to check modification status:
	global.Chinotto.defineAssertion("modified", (subject, expected) =>
		[subject.isModified(), "to be modified"]);

	// Usage:
	expect("/some/edited/file").to.be.modified;
	expect("/unedited/file").not.to.be.modified;
	~~~




<!-- Referenced links -->
[`atom-mocha`]: https://github.com/Alhadis/Atom-Mocha/blob/dec4a46c/docs/extensions.md
[`Object`]:     https://mdn.io/Object.prototype
[`Function`]:   https://mdn.io/Function
[`Map`]:        https://mdn.io/Map
[`chai`]:       https://npmjs.com/package/chai
[`register()`]: #register
[AppVeyor-badge]: https://ci.appveyor.com/api/projects/status/6cx2pnqvgc8g50q0?svg=true
[AppVeyor-link]:  https://ci.appveyor.com/project/Alhadis/Chinotto
[TravisCI-badge]: https://travis-ci.org/Alhadis/Chinotto.svg?branch=master
[TravisCI-link]:  https://travis-ci.org/Alhadis/Chinotto
[Coverage-badge]: https://img.shields.io/coveralls/Alhadis/Chinotto.svg
[Coverage-link]:  https://coveralls.io/github/Alhadis/Chinotto?branch=master


API reference
-------------
<!-- Begin JSDoc -->

<h3>Extension list</h3>

* [Methods](#methods)
	* [`class()`](#class)
	* [`equalPath()`](#equal-path)
	* [`hardLink()`](#hard-link)
	* [`pointTo()`](#point-to)
* [Properties](#properties)
	* [`.blockDevice`](#block-device)
	* [`.characterDevice`](#character-device)
	* [`.device`](#device)
	* [`.directory`](#directory)
	* [`.door`](#door)
	* [`.drawn`](#drawn)
	* [`.existOnDisk`](#exist-on-disk)
	* [`.fifo`](#fifo)
	* [`.file`](#file)
	* [`.focus`](#focus)
	* [`.socket`](#socket)
	* [`.symlink`](#symlink)

<h3>Exports</h3>

* `chai`: <code><a href="https://mdn.io/Object">Object</a></code> — Reference to the Chai module used by Chinotto.
* `methods`: [`Map`](https://mdn.io/Map) — Handler functions for assertion methods, keyed by name(s)
* `properties`: [`Map`](https://mdn.io/Map) — Handler functions for assertion properties, keyed by name(s)

The remaining exports are detailed under [Utils](#utils):
* [`addMethod()`](#add-method)
* [`addProperty()`](#add-property)
* [`defineAssertion()`](#define-assertion)
* [`defineAssertions()`](#define-assertions)
* [`register()`](#register)

<h3>Methods</h3>

<h4><code><a name="class">class()</a></code>/<code><a name="classes">classes()</a></code></h4>

Check if an <a href="https://mdn.io/HTMLElement"><code>HTMLElement</code></a> contains one or more CSS classes.

<table width="100%"><thead><tr><th>Parameter</th><th>Type</th><th>Attributes</th><th>Description</th></tr></thead>
<tbody><tr>
	<td valign="top"><code>expected</code></td>
	<td valign="top"><code><a href="https://mdn.io/String">String</a></code>, <code><a href="https://mdn.io/Array">Array</a>.<<a href="https://mdn.io/String">String</a>></code></td>
	<td valign="top"><i>Variadic</i></td>
	<td valign="top">An array or whitespace-delimited list of CSS class-names</td>
</tr></tbody>
</table>

**Example:**  
~~~js
document.body.should.have.class("content");
expect($(".btn.large")).to.have.classes("btn", "large");
~~~

<h4><code><a name="equal-path">equalPath()</a></code></h4>

Assert that two filesystem paths are logically the same.

<table width="100%"><thead><tr><th>Parameter</th><th>Type</th></tr></thead>
<tbody><tr>
	<td valign="top"><code>target</code></td>
	<td valign="top"><code><a href="https://mdn.io/String">String</a></code></td>
</tr></tbody>
</table>

**Example:**  
~~~js
"/bin".should.equalPath("/bin/");
"/bin/../bin".should.equalPath("/bin");
~~~

<h4><code><a name="hard-link">hardLink()</a></code>/<code><a name="hard-link-of">hardLinkOf()</a></code></h4>

Assert that two files have the same inode and device number.

<table width="100%"><thead><tr><th>Parameter</th><th>Type</th></tr></thead>
<tbody><tr>
	<td valign="top"><code>target</code></td>
	<td valign="top"><code><a href="https://mdn.io/String">String</a></code></td>
</tr></tbody>
</table>

**Example:**  
~~~js
"/a/huge/file".should.have.hardLink("/same/huge/file");
expect("huge.file").to.be.hardLinkOf("also.huge");
~~~

<h4><code><a name="point-to">pointTo()</a></code>/<code><a name="pointing-to">pointingTo()</a></code></h4>

Assert that a symbolic link points to the specified file.

<table width="100%"><thead><tr><th>Parameter</th><th>Type</th></tr></thead>
<tbody><tr>
	<td valign="top"><code>target</code></td>
	<td valign="top"><code><a href="https://mdn.io/String">String</a></code></td>
</tr></tbody>
</table>

**Example:**  
~~~js
"/tmp".should.be.a.symlink.pointingTo("/private/tmp");
~~~

<h3>Properties</h3>

<h4><code><a name="drawn">.drawn</a></code></h4>

Assert that an <a href="https://mdn.io/HTMLElement"><code>HTMLElement</code></a> is rendered in the DOM tree.

**Example:**  
~~~js
document.body.should.be.drawn;
document.head.should.not.be.drawn;
~~~

<h4><code><a name="focus">.focus</a></code></h4>

Assert that an <a href="https://mdn.io/HTMLElement"><code>HTMLElement</code></a> has user focus, or contains something which does.

**Example:**  
~~~js
document.activeElement.should.have.focus;
document.createElement("div").should.not.have.focus;
~~~

<h4><code><a name="exist-on-disk">.existOnDisk</a></code>/<code><a name="exists-on-disk">.existsOnDisk</a></code></h4>

Assert that a file exists in the filesystem.

**Example:**  
~~~js
"/bin/sh".should.existOnDisk
"<>:*?\0".should.not.existOnDisk
~~~

<h4><code><a name="file">.file</a></code>/<code><a name="regular-file">.regularFile</a></code></h4>

Assert that subject is a path pointing to a regular file.

**Example:**  
~~~js
"/bin/sh".should.be.a.file
"/bin".should.not.be.a.file
~~~

<h4><code><a name="directory">.directory</a></code></h4>

Assert that subject is a path pointing to a directory.

**Example:**  
~~~js
"/bin".should.be.a.directory
"/bin/sh".should.not.be.a.directory
~~~

<h4><code><a name="symlink">.symlink</a></code>/<code><a name="symbolic-link">.symbolicLink</a></code></h4>

Assert that subject is a path pointing to a symbolic link.

**Example:**  
~~~js
"/usr/local/bin/node".should.be.a.symlink
~~~

<h4><code><a name="device">.device</a></code>/<code><a name="device-file">.deviceFile</a></code></h4>

Assert that subject is a path pointing to a device file.

“Device file” refers to either a character device or a block device, making
this assertion preferable to <a href="https://mdn.io/blockDevice"><code>blockDevice</code></a> and <a href="https://mdn.io/characterDevice"><code>characterDevice</code></a>
for cross-platform testing.

**Example:**  
~~~js
"/dev/zero".should.be.a.device;
~~~

<h4><code><a name="block-device">.blockDevice</a></code></h4>

Assert that subject is a path pointing to a block device.

**Example:**  
~~~js
"/dev/disk0s1".should.be.a.blockDevice
~~~

<h4><code><a name="character-device">.characterDevice</a></code>/<code><a name="char-device">.charDevice</a></code></h4>

Assert that subject is a path pointing to a character device.

**Example:**  
~~~js
"/dev/null".should.be.a.characterDevice
~~~

<h4><code><a name="fifo">.fifo</a></code>/<code><a name="named-pipe">.namedPipe</a></code></h4>

Assert that subject is a path pointing to a FIFO (named pipe).

**Example:**  
~~~js
"/tmp/154B17E1-2BF7_IN".should.be.a.fifo
~~~

<h4><code><a name="door">.door</a></code></h4>

Assert that subject is a path pointing to a door.

**Example:**  
~~~js
"/system/volatile/syslog_door".should.be.a.door
~~~

<h4><code><a name="socket">.socket</a></code></h4>

Assert that subject is a path pointing to a socket.

**Example:**  
~~~js
"/run/systemd/private".should.be.a.socket
~~~

<h3>Utils</h3>

<h4><code><a name="add-method">addMethod()</a></code></h4>

Variant of <a href="https://mdn.io/chai.Assertion.addMethod"><code>chai.Assertion.addMethod</code></a> that supports plugin aliases.

If the property already exists on the prototype, it will not be overwritten.
To redefine existing methods and prototypes, use <a href="https://mdn.io/chai.util.addMethod"><code>chai.util.addMethod</code></a>
or <a href="https://mdn.io/chai.util.overwriteMethod"><code>chai.util.overwriteMethod</code></a>.

<table width="100%"><thead><tr><th>Parameter</th><th>Type</th></tr></thead>
<tbody><tr>
	<td valign="top"><code>names</code></td>
	<td valign="top"><code><a href="https://mdn.io/String">String</a></code>, <code><a href="https://mdn.io/Array">Array</a>.<<a href="https://mdn.io/String">String</a>></code></td>
</tr></tbody>

<tbody><tr>
	<td valign="top"><code>fn</code></td>
	<td valign="top"><code>function</code></td>
</tr></tbody>
</table>

**Example:**  
~~~js
addMethod(["pointTo", "pointingTo"], function(target){ … });
~~~

<h4><code><a name="add-property">addProperty()</a></code></h4>

Variant of <a href="https://mdn.io/chai.Assertion.addProperty"><code>chai.Assertion.addProperty</code></a> that supports plugin aliases.

<table width="100%"><thead><tr><th>Parameter</th><th>Type</th></tr></thead>
<tbody><tr>
	<td valign="top"><code>names</code></td>
	<td valign="top"><code><a href="https://mdn.io/String">String</a></code>, <code><a href="https://mdn.io/Array">Array</a>.<<a href="https://mdn.io/String">String</a>></code></td>
</tr></tbody>

<tbody><tr>
	<td valign="top"><code>fn</code></td>
	<td valign="top"><code>function</code></td>
</tr></tbody>
</table>

**Example:**  
~~~js
addProperty(["coloured", "colored"], fn);
~~~

<h4><code><a name="define-assertion">defineAssertion()</a></code></h4>

Variant of <a href="https://mdn.io/defineAssertions"><code>defineAssertions</code></a> that defines only one assertion.

<table width="100%"><thead><tr><th>Parameter</th><th>Type</th></tr></thead>
<tbody><tr>
	<td valign="top"><code>names</code></td>
	<td valign="top"><code><a href="https://mdn.io/String">String</a></code>, <code><a href="https://mdn.io/Array">Array</a>.<<a href="https://mdn.io/String">String</a>></code></td>
</tr></tbody>

<tbody><tr>
	<td valign="top"><code>handler</code></td>
	<td valign="top"><code>function</code></td>
</tr></tbody>
</table>

<h4><code><a name="define-assertions">defineAssertions()</a></code></h4>

Wrapper for defining simple custom Chai assertions.

<table width="100%"><thead><tr><th>Parameter</th><th>Type</th></tr></thead>
<tbody><tr>
	<td valign="top"><code>spec</code></td>
	<td valign="top"><code><a href="https://mdn.io/Object">Object</a></code></td>
</tr></tbody>
</table>

**Example:**  
~~~js
<caption>Defining a "colour" assertion</caption>
// Typical definition:
defineAssertions({
   ["colour, coloured"](subject, expected){
       const actual = subject.colour;
       this.assert(
           actual === expected,
           "expected #{this} to be coloured #{exp}",
           "expected #{this} not to be coloured #{exp}",
           expected,
           actual
       );
   },
});

// Usage:
expect({colour: 0xFF0000}).to.have.colour(0xFF0000);
expect({colour: "red"}).not.to.be.coloured("green");

<caption>Shorthand for the above</caption>
defineAssertions({
   ["colour, coloured"](subject, expected){
       return [
           subject.colour === expected,
           "to be coloured #{exp}",
       ];
   },
});
~~~

<h4><code><a name="register">register()</a></code></h4>

Register every available Chai extension.

**Example:**  
~~~js
import Chinotto from "./lib/index.mjs";
Chinotto.register();
~~~

