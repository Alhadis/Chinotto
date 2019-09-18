"use strict";

describe("DOM-specific extensions", () => {
	const isBrowser = isNativeDOM();
	const {AssertionError, expect} = isBrowser ? window.chai : require("chai");
	
	if(!isBrowser && process.env.NYC_PROCESS_ID){
		const exported = "document Node HTMLElement HTMLBodyElement HTMLInputElement".split(" ");
		const JSDOM = new (require("jsdom").JSDOM)();
		Object.assign(global, {JSDOM, window: JSDOM.window});
		exported.forEach(key => global[key] = window[key]);
		
		const {prototype} = JSDOM.window.HTMLElement;
		const {getBoundingClientRect} = prototype;
		prototype.getBoundingClientRect = function(){
			if(this.hidden || "none" === this.style.display)
				return {top: 0, left: 0, right: 0, bottom: 0};
			if(this.parentNode && this.textContent)
				return {top: 2, left: 2, right: 5, bottom: 5};
			else
				return getBoundingClientRect.call(this);
		};
	}
	
	before(() => isBrowser || require("../register.js"));
	
	afterEach(() => [...document.body.childNodes].forEach(child => {
		if(Node.ELEMENT_NODE !== child.nodeType || !child.matches("#mocha"))
			child.parentNode.removeChild(child);
	}));
	
	describe(".class", () => {
		let head, body, oldClasses = [];
		beforeEach(() => {
			({head, body} = document);
			oldClasses = [head.className, body.className];
			head.className = "";
			body.className = "";
		});
		afterEach(() => {
			head.className = oldClasses[0];
			body.className = oldClasses[1];
		});
		
		it("identifies single names", () => {
			body.classList.add("foo");
			expect(body).to.have.class("foo");
			expect(body).to.have.classes("foo");
			body.classList.add("bar");
			expect(body).to.have.class("bar");
			expect(body).to.have.classes("bar");
		});
		it("identifies multiple names", () => {
			body.classList.add("bar", "foo");
			expect(body).to.have.class("foo", "bar");
			expect(body).to.have.classes("foo", "bar");
		});
		it("identifies missing classes", () => {
			expect(body).not.to.have.class("baaaz");
			expect(body).not.to.have.classes("qux");
			expect(body).not.to.have.class("qux", "baaaz");
			expect(body).not.to.have.classes("qux", "baz");
		});
		it("generates meaningful errors", () => {
			const fn1 = () => expect(body).to.have.class("bar");
			const fn2 = () => expect(body).not.to.have.class("foo");
			body.classList.add("foo");
			expect(fn1).to.throw(AssertionError, 'expected classList "foo" to include "bar"');
			expect(fn2).to.throw(AssertionError, 'expected classList "foo" not to include "foo"');
			body.className = "";
			expect(fn1).to.throw(AssertionError, 'expected empty classList to include "bar"');
		});
		it("chains correctly", () => {
			body.classList.add("foo");
			expect(body).to.have.class("foo").and.to.be.an.instanceOf(HTMLBodyElement);
			expect(body).not.to.have.class("bar").and.not.to.be.a("string");
			body.classList.add("bar");
			expect(body).to.have.classes("bar", "foo").and.be.instanceOf(HTMLBodyElement);
			expect(body).not.to.have.classes("qux", "baz").and.not.to.be.a("string");
		});
		it("tests every argument by default", () => {
			body.className = "foo bar";
			expect(body).to.have.classes("foo", "bar");
			body.classList.remove("bar");
			expect(body).not.to.have.classes("foo", "bar");
			body.classList.add("qux");
			expect(body).to.have.classes("foo", "qux");
			const fn1 = () => expect(body).to.have.classes("foo", "bar");
			const fn3 = () => expect(body).not.to.have.any.of.classes("foo", "bar");
			const fn2 = () => expect(body).not.to.have.classes("foo", "qux");
			expect(fn1).to.throw(AssertionError, 'expected classList "foo qux" to include "bar"');
			expect(fn3).to.throw(AssertionError, 'expected classList "foo qux" not to include "foo"');
			expect(fn2).to.throw(AssertionError, 'expected classList "foo qux" not to include "foo" and "qux"');
			body.className = "qul";
			expect(fn1).to.throw(AssertionError, 'expected classList "qul" to include "foo" and "bar"');
			body.className = "foo qux";
			expect(fn2).to.throw(AssertionError, 'expected classList "foo qux" not to include "foo" and "qux"');
		});
		it("tests only one argument if `.any` is set", () => {
			body.className = "foo bar";
			expect(body).to.have.any.of.classes("foo", "baz");
			expect(body).not.to.have.any.of.classes("quz", "qux");
			const fn1 = () => expect(body).to.have.any.of.classes("quz", "qux");
			const fn2 = () => expect(body).not.to.have.any.of.classes("foo", "baz");
			expect(fn1).to.throw(AssertionError, 'expected classList "foo bar" to include "quz" or "qux"');
			expect(fn2).to.throw(AssertionError, 'expected classList "foo bar" not to include "foo"');
		});
		it("tests the classes of multiple elements", () => {
			head.className = "foo bar qux";
			body.className = "foo baz qux";
			expect([head, body]).to.have.class("foo");
			expect([head, body]).to.have.class("qux", "foo");
			expect([head, body]).to.have.classes("foo");
			expect([head, body]).to.have.classes("qux", "foo");
			expect([head, body]).not.to.have.class("qul");
			expect([head, body]).not.to.have.class("quuux", "qul");
			expect([head, body]).not.to.have.classes("qul");
			expect([head, body]).not.to.have.classes("quuux", "qul");
			let fn1 = () => expect([head, body]).to.have.class("bar");
			let fn2 = () => expect([head, body]).to.have.class("baz");
			expect(fn1).to.throw(AssertionError, 'expected classList "foo baz qux" to include "bar"');
			expect(fn2).to.throw(AssertionError, 'expected classList "foo bar qux" to include "baz"');
			fn1 = () => expect([head, body]).not.to.have.class("baz");
			fn2 = () => expect([head, body]).not.to.have.class("bar");
			expect(fn1).to.throw(AssertionError, 'expected classList "foo baz qux" not to include "baz"');
			expect(fn2).to.throw(AssertionError, 'expected classList "foo bar qux" not to include "bar"');
		});
	});
	
	
	describe(".drawn", () => {
		it("tests false if detached", () => {
			const el = Object.assign(document.createElement("div"), {textContent: "Foo"});
			expect(el).not.to.be.drawn;
		});
		it("tests true if attached",  () => {
			const el = Object.assign(document.createElement("div"), {textContent: "Foo"});
			document.body.appendChild(el);
			expect(el).to.be.drawn;
		});
		it("tests true if invisible", () => {
			const el            = document.createElement("div");
			el.textContent      = "Foo";
			el.style.visibility = "hidden";
			document.body.appendChild(el);
			expect(el).to.be.drawn;
		});
		it("tests true if 100% transparent", () => {
			const el         = document.createElement("div");
			el.textContent   = "Foo";
			el.style.opacity = 0;
			document.body.appendChild(el);
			expect(el).to.be.drawn;
		});
		it("tests false if hidden", () => {
			const el         = document.createElement("div");
			el.textContent   = "Foo";
			el.style.display = "none";
			document.body.appendChild(el);
			expect(el).not.to.be.drawn;
		});
		it("tests false if its dimensions are zero", () => {
			const el        = document.createElement("div");
			el.style.width  = 0;
			el.style.height = 0;
			document.body.appendChild(el);
			expect(el).not.to.be.drawn;
		});
		it("tests true for elements outside the viewport", () => {
			const el          = document.createElement("div");
			el.textContent    = "Foo";
			el.style.position = "absolute";
			el.style.left     = "-9999px";
			el.style.top      = "-9999px";
			document.body.appendChild(el);
			expect(el).to.be.drawn;
			el.style.display = "none";
			expect(el).not.to.be.drawn;
		});
		it("uses the first entry if given a jQuery result", () => {
			const el = document.createElement("div");
			el.textContent = "Foo";
			document.body.appendChild(el);
			expect({jquery: true, 0: el}).to.be.drawn;
			document.body.removeChild(el);
			expect({jquery: true, 0: el}).not.to.be.drawn;
		});
	});
	
	
	describe(".focus", () => {
		let active, inactive;
		beforeEach(() => {
			inactive = document.createElement("input");
			active   = document.createElement("input");
			inactive.dataset.active = false;
			active  .dataset.active = true;
			document.body.appendChild(inactive);
			document.body.appendChild(active);
			active.focus();
		});
		it("identifies elements with focus",      () => expect(active).to.have.focus);
		it("identifies elements without focus",   () => expect(inactive).not.to.have.focus);
		it("generates meaningful error messages", () => {
			const fn1 = () => expect(inactive).to.have.focus;
			const fn2 = () => expect(active).not.to.have.focus;
			const fn3 = () => expect("foo").to.have.focus;
			const fn4 = () => expect("bar").not.to.have.focus;
			expect(fn1).to.throw(AssertionError, "expected element to have focus");
			expect(fn2).to.throw(AssertionError, "expected element not to have focus");
			expect(fn3).to.throw(TypeError, "subject is not an HTMLElement or component-like object");
			expect(fn4).to.throw(TypeError, "subject is not an HTMLElement or component-like object");
		});
		it("chains correctly", () => {
			expect(active).to.have.focus.and.be.an.instanceOf(HTMLInputElement);
			expect(inactive).not.to.have.focus.and.not.to.be.a("boolean");
		});
		it("tests true for children of focussed elements", () => {
			const parent = Object.assign(document.createElement("div"), {tabIndex: 0});
			document.body.appendChild(parent);
			parent.appendChild(active);
			active.focus();
			expect(active).to.have.focus.and.to.equal(document.activeElement);
			expect(parent).not.to.have.focus.and.not.equal(document.activeElement);
			parent.focus();
			expect(active).to.have.focus.and.not.equal(document.activeElement);
			expect(parent).to.have.focus.and.equal(document.activeElement);
		});
		it("uses the first entry of jQuery instances", () =>
			expect({jquery: true, 0: active}).to.have.focus);
		it("uses the `.element` property of component-like objects", () => {
			const body = {element: document.body};
			const view = {element: document.body.appendChild(document.createElement("div"))};
			view.element.tabIndex = 0;
			view.element.focus();
			expect(body).not.to.have.focus.and.equal(document.activeElement);
			expect(view).to.have.focus.and.not.equal(document.activeElement);
			view.element.blur();
			expect(body).to.have.focus.and.not.equal(document.activeElement);
			expect(view).to.have.focus.and.not.equal(document.activeElement);
		});
	});
});


/**
 * Determine if the environment supports DOM APIs natively.
 * @see {@link https://ecma-international.org/ecma-262/#sec-IsHTMLDDA-internal-slot|`[[IsHTMLDDA]]`}
 * @see {@link https://mdn.io/document.all}
 * @return {Boolean}
 */
function isNativeDOM(){
	const self = "object" === typeof globalThis
		? globalThis
		: "object" === typeof global
			? global
			: this;
	
	const {document, window} = self;
	if("object" !== typeof document || "object" !== typeof window)
		return false;
	
	const {HTMLAllCollection} = window;
	if("function" !== typeof HTMLAllCollection)
		return false;
	
	const {all} = document;
	if("undefined" === typeof all && HTMLAllCollection === all.constructor)
		return true;
	
	return false;
}
