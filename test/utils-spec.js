"use strict";

const Chai     = require("chai");
const Chinotto = require("../index.js");
const {AssertionError} = Chai;


describe("Utility functions", () => {
	describe("addMethod()", () => {
		const {addMethod} = Chinotto;
		
		it("defines custom assertion methods", () => {
			const name = "customMethod";
			const pass = name + ": this should pass";
			const fail = name + ": this should fail";
			addMethod(name, function(arg){
				const subject = Chai.util.flag(this, "object");
				this.assert(subject === arg, pass, fail);
			});
			expect(1)    .to[name](1);
			expect(1).not.to[name](2);
			expect(() => expect(1)    .to[name](2)).to.throw(AssertionError, pass);
			expect(() => expect(1).not.to[name](1)).to.throw(AssertionError, fail);
		});
		
		it("supports method aliases", () => {
			const name = "customMethod";
			const pass = name + ": this should pass";
			const fail = name + ": this should fail";
			addMethod([name, name + "s"], function(arg){
				const subject = Chai.util.flag(this, "object");
				this.assert(subject === arg, pass, fail);
			});
			expect(1)    .to[name      ](1);
			expect(1)    .to[name + "s"](1);
			expect(1).not.to[name      ](2);
			expect(1).not.to[name + "s"](2);
			expect(() => expect(1).to  [name      ](2)).to.throw(AssertionError, pass);
			expect(() => expect(1).to  [name + "s"](2)).to.throw(AssertionError, pass);
			expect(() => expect(1).not [name      ](1)).to.throw(AssertionError, fail);
			expect(() => expect(1).not [name + "s"](1)).to.throw(AssertionError, fail);
		});
		
		it("doesn't overwrite built-in methods", () => {
			let called = false;
			addMethod("match", function(){
				called = true;
				this.assert(false);
			});
			expect("ABC").to.match(/^[A-Z]{3}$/);
			expect(called).to.equal(false);
		});
		
		it("doesn't overwrite custom methods", () => {
			const name = "anotherCustomMethod";
			let called = 0;
			addMethod(name, function(){
				called = 1;
				this.assert(true, "this should pass");
			});
			addMethod(name, function(){
				if(1 === called) called = 2;
				this.assert(false, "this shouldn't happen");
			});
			expect(true).to.have[name](1);
			expect(called).to.equal(1);
		});
	});
	
	
	describe("addProperty()", () => {
		const {addProperty} = Chinotto;
		
		it("defines custom assertion properties", () => {
			const name = "customProperty";
			const pass = name + ": this should pass";
			const fail = name + ": this should fail";
			addProperty(name, function(){
				const subject = Chai.util.flag(this, "object");
				this.assert(subject, pass, fail);
			});
			expect(true)     .to[name].and.equal(true);
			expect(false).not.to[name].and.equal(true);
			expect(() => expect(false)   .to[name].and.equal(false)).to.throw(AssertionError, pass);
			expect(() => expect(true).not.to[name].and.equal(false)).to.throw(AssertionError, fail);
		});
		
		it("supports property aliases", () => {
			const name = "aliasedProperty";
			const pass = name + ": this should pass";
			const fail = name + ": this should fail";
			addProperty([name, name + "2"], function(){
				const subject = Chai.util.flag(this, "object");
				this.assert(subject, pass, fail);
			});
			expect(true)     .to[name]       .and.equal(true);
			expect(true)     .to[name + "2"] .and.equal(true);
			expect(false).not.to[name]       .and.equal(true);
			expect(false).not.to[name + "2"] .and.equal(true);
			expect(() => expect(false) .to  [name      ].and.equal(true)).to.throw(AssertionError, pass);
			expect(() => expect(false) .to  [name + "2"].and.equal(true)).to.throw(AssertionError, pass);
			expect(() => expect(true)  .not [name      ].and.equal(true)).to.throw(AssertionError, fail);
			expect(() => expect(true)  .not [name + "2"].and.equal(true)).to.throw(AssertionError, fail);
		});
		
		it("doesn't overwrite built-in properties", () => {
			let called = false;
			addProperty("ok", function(){
				called = true;
				this.assert(false);
			});
			expect("ABC").to.be.ok.and.equal("ABC");
			expect(called).to.equal(false);
		});
		
		it("doesn't overwrite custom properties", () => {
			const name = "anotherCustomProperty";
			let called = 0;
			addProperty(name, function(){
				called = 1;
				this.assert(true, "this should pass");
			});
			addProperty(name, function(){
				if(1 === called) called = 2;
				this.assert(false, "this shouldn't happen");
			});
			expect(called).to.equal(0);
			expect(true).to[name].and.equal(true);
			expect(called).to.equal(1);
		});
	});
	
	
	describe("defineAssertions()", () => {
		const {defineAssertions} = Chinotto;
		
		describe("Methods", () => {
			before(() => defineAssertions({
				["colour, coloured"](subject, expected){
					const actual = subject.colour;
					this.assert(
						actual === expected,
						"expected #{this} to be coloured #{exp}",
						"expected #{this} not to be coloured #{exp}",
						expected,
						actual
					);
				}}));
			
			it("defines basic assertions", () => {
				const obj = {colour: 0xFF0000};
				expect(obj).to.have.colour(0xFF0000);
				expect(obj).to.not.have.colour(0x00F);
			});
			
			it("defines assertions with aliases", () => {
				const obj = {colour: 0xFF0000};
				expect(obj).to.be.coloured(0xFF0000);
				expect(obj).not.to.be.coloured(0x00F);
			});
			
			it("chains them correctly", () => {
				expect({colour: "red"}).to.have.colour("red").and.not.colour("green");
			});
			
			it("allows multiple arguments be passed", () => {
				defineAssertions({
					size(subject, width, height){
						const exp = `${width} × ${height}`;
						const act = `${subject.width} × ${subject.height}`;
						return [
							act === exp,
							"expected #{this} to have size #{exp} but got #{act}",
							"expected #{this} not to have size #{act} but got #{exp}",
							exp,
							act,
						];
					},
				});
				const obj = {width: 1024, height: 768};
				expect(obj).to.have.size(1024, 768);
				expect(obj).not.to.have.size(1024, 100);
				expect(obj).not.to.have.size(768, 1024);
				const fn1 = () => expect(obj).to.have.size(1024, 100);
				const fn2 = () => expect(obj).not.to.have.size(1024, 768);
				const pre = "expected { width: 1024, height: 768 }";
				expect(fn1).to.throw(AssertionError, `${pre} to have size '1024 × 100' but got '1024 × 768'`);
				expect(fn2).to.throw(AssertionError, `${pre} not to have size '1024 × 768' but got '1024 × 768'`);
			});
		});
		
		describe("Properties", () => {
			before(() => defineAssertions({
				freezing(subject){
					this.assert(
						subject.temperature <= 0,
						"expected #{this} to be freezing",
						"expected #{this} not to be freezing",
					);
				},
				boiling(subject){
					this.assert(
						subject.temperature >= 100, // Celsius rules, get over it
						"expected #{this} to be as hot as #{exp}°C but got #{act}°C",
						"expected #{this} to be cooler than #{exp}°C but got #{act}°C",
						100,
						subject.temperature,
					);
				},
			}));
			
			it("defines a property if handler lacks parameter arguments", () => {
				expect({temperature: -30}).to.be.freezing     .and.not.boiling.and.to.be.an("array");
				expect({temperature:  40}).not.to.be.freezing .and.not.boiling.and.to.be.an("array");
				expect({temperature: 120}).to.be.boiling      .and.not.freezing.and.to.be.an("array");
				expect({temperature:  80}).not.to.be.boiling  .and.not.freezing.and.to.be.an("array");
				const fn1 = () => expect({temperature:  50}).to.be.freezing;
				const fn2 = () => expect({temperature:  -3}).not.to.be.freezing;
				const fn3 = () => expect({temperature:  80}).to.be.boiling;
				const fn4 = () => expect({temperature: 120}).not.to.be.boiling;
				expect(fn1).to.throw(AssertionError, "expected { temperature: 50 } to be freezing");
				expect(fn2).to.throw(AssertionError, "expected { temperature: -3 } not to be freezing");
				expect(fn3).to.throw(AssertionError, "expected { temperature: 80 } to be as hot as 100°C but got 80°C");
				expect(fn4).to.throw(AssertionError, "expected { temperature: 120 } to be cooler than 100°C but got 120°C");
			});
			
			it("does not allow them to be called as functions", () => {
				const fn = () => expect({temperature: -10}).to.be.freezing();
				expect(fn).to.throw(TypeError, / is not a function$/);
			});
			
			it("does not call them when chained", () => {
				expect({temperature: -30, colour: "blue"}) .to.be.freezing.and.have.colour("blue");
				expect({temperature: +30, colour: "red"})  .not.to.be.freezing.and.have.colour("green");
			});
		});
		
		describe("Shorthand definitions", () => {
			before(() => defineAssertions({
				width(subject, expected){
					return [
						subject.width === expected,
						"to have width #{exp}",
					];
				},
				height(subject, expected){
					return [
						subject.height === expected,
						`Custom pass message (${expected}, ${subject.height})`,
						`Custom fail message (${expected}, ${subject.height})`,
					];
				},
			}));
			
			when("the handler function returns an array", () => {
				it("uses them as arguments for .assert()", () => {
					expect({height: 2.5}).to.have.height(2.5);
					expect({height: 500}).not.to.have.height(250);
					const fn1 = () => expect({height: 35}).to.have.height(59);
					const fn2 = () => expect({height: 78}).not.to.have.height(78);
					expect(fn1).to.throw(AssertionError, "Custom pass message (59, 35)");
					expect(fn2).to.throw(AssertionError, "Custom fail message (78, 78)");
				});
				it("expands shorthand to fill missing parameters", () => {
					expect({width: 30}).to.have.width(30);
					expect({width: 30}).not.to.have.width(20);
					const fn1 = () => expect({width: 30}).to.have.width(80);
					const fn2 = () => expect({width: 25}).not.to.have.width(25);
					expect(fn1).to.throw(AssertionError, "expected { width: 30 } to have width 80");
					expect(fn2).to.throw(AssertionError, "expected { width: 25 } not to have width 25");
				});
			});
		});
	});
	
	
	describe("defineAssertion()", () => {
		const {defineAssertion} = Chinotto;
		
		it("defines an assertion using separate parameters", () => {
			defineAssertion("flavour", function(subject, expected){
				this.assert(
					subject.flavour === expected,
					"expected #{this} to taste like #{exp}",
					"expected #{this} not to taste like #{exp}",
					expected,
					subject.flavour
				);
			});
			expect({flavour: "chocolate"}).to.have.flavour("chocolate");
			expect({flavour: "strawberry"}).not.to.have.flavour("chocolate");
			const fn1 = () => expect({flavour: "vanilla"}).to.have.flavour("coffee");
			const fn2 = () => expect({flavour: "vanilla"}).not.to.have.flavour("vanilla");
			expect(fn1).to.throw(AssertionError, "expected { flavour: 'vanilla' } to taste like 'coffee'");
			expect(fn2).to.throw(AssertionError, "expected { flavour: 'vanilla' } not to taste like 'vanilla'");
		});
		
		it("accepts an array of name variations", () => {
			defineAssertion(["cost", "price"], function(subject, expected){
				this.assert(
					subject.cost === expected,
					"expected #{this} to cost $#{exp} instead of $#{act}",
					"expected #{this} not to cost $#{exp} instead of $#{act}",
					expected,
					subject.cost
				);
			});
			expect({cost: 50}).to.have.price(50).and.not.cost(60);
			expect({cost: 35}).not.to.have.price(78).and.not.cost(90);
			const fn1 = () => expect({cost: 45}).to.have.cost(78);
			const fn2 = () => expect({cost: 55}).not.to.have.cost(55);
			expect(fn1).to.throw(AssertionError, "expected { cost: 45 } to cost $78 instead of $45");
			expect(fn2).to.throw(AssertionError, "expected { cost: 55 } not to cost $55 instead of $55");
		});
	});


	describe("flattenList()", () => {
		const {flattenList} = Chinotto;
		
		it("splits strings by whitespace", () => {
			expect(flattenList("foo bar"))     .to.eql(["foo", "bar"]);
			expect(flattenList("foo bar baz")) .to.eql(["foo", "bar", "baz"]);
		});
		
		it("trims strings before splitting them", () => {
			expect(flattenList("foo "))        .to.eql(["foo"]);
			expect(flattenList(" foo"))        .to.eql(["foo"]);
			expect(flattenList(" foo bar "))   .to.eql(["foo", "bar"]);
		});
		
		it("flattens simple arrays", () => {
			expect(flattenList(["foo", ["bar"]]))          .to.eql(["foo", "bar"]);
			expect(flattenList(["foo", ["bar"], ["baz"]])) .to.eql(["foo", "bar", "baz"]);
			expect(flattenList(["foo", ["bar", "baz"]]))   .to.eql(["foo", "bar", "baz"]);
		});
		
		it("flattens nested arrays", () => {
			expect(flattenList(["foo", ["bar", ["baz"]], "qux"]))   .to.eql(["foo", "bar", "baz", "qux"]);
			expect(flattenList(["foo", ["bar", ["baz", "qux"]]]))   .to.eql(["foo", "bar", "baz", "qux"]);
			expect(flattenList(["foo", ["bar", ["baz", ["qux"]]]])) .to.eql(["foo", "bar", "baz", "qux"]);
		});
		
		it("splits strings in arrays", () => {
			expect(flattenList(["foo bar"]))                 .to.eql(["foo", "bar"]);
			expect(flattenList(["foo", "bar baz", "qux"]))   .to.eql(["foo", "bar", "baz", "qux"]);
			expect(flattenList(["foo", ["bar baz"], "qux"])) .to.eql(["foo", "bar", "baz", "qux"]);
		});
		
		it("ignores empty values", () => {
			expect(flattenList([])).to.eql([]);
			expect(flattenList("")).to.eql([]);
			expect(flattenList(" ")).to.eql([]);
			expect(flattenList(["", []])).to.eql([]);
			expect(flattenList(["", [""]])).to.eql([]);
		});
		
		it("handles circular references", () => {
			const a = ["foo", ["bar"]];
			const b = [["baz"], "qux"];
			a.push(b);
			b.push(a);
			expect(flattenList(a)).to.eql(["foo", "bar", "baz", "qux"]);
			expect(flattenList(b)).to.eql(["baz", "qux", "foo", "bar"]);
			expect(flattenList([b, b, b, a])).to.eql(["baz", "qux", "foo", "bar"]);
		});
	});
	
	
	describe("formatList()", () => {
		const {formatList} = Chinotto;
		
		it("formats 1-string lists", () => expect(formatList(["A"]))                .to.equal('"A"'));
		it("formats 2-string lists", () => expect(formatList(["A", "B"]))           .to.equal('"A" and "B"'));
		it("formats 3-string lists", () => expect(formatList(["A", "B", "C"]))      .to.equal('"A", "B" and "C"'));
		it("formats 4-string lists", () => expect(formatList(["A", "B", "C", "D"])) .to.equal('"A", "B", "C" and "D"'));
		it("formats empty lists",    () => expect(formatList([]))                   .to.equal('""'));
		it("formats empty strings",  () => {
			expect(formatList([""])).to.equal('""');
			expect(formatList(["A", "", "Z"])).to.equal('"A", "" and "Z"');
		});
		it("formats object values", () => {
			const obj = {toJSON: () => "Foo"};
			expect(formatList([obj]))                 .to.equal('"Foo"');
			expect(formatList(["A", obj]))            .to.equal('"A" and "Foo"');
			expect(formatList(["A", obj, "Z"]))       .to.equal('"A", "Foo" and "Z"');
		});
		it("supports arbitrary conjunctions", () => {
			expect(formatList(["A", "B"],      "or")) .to.equal('"A" or "B"');
			expect(formatList(["A", "B", "C"], "or")) .to.equal('"A", "B" or "C"');
		});
		it("supports the Oxford comma", () => {
			expect(formatList(["A"],                "and", true)).to.equal('"A"');
			expect(formatList(["A", "B"],           "and", true)).to.equal('"A" and "B"');
			expect(formatList(["A", "B", "C"],      "and", true)).to.equal('"A", "B", and "C"');
			expect(formatList(["A", "B", "C", "D"], "and", true)).to.equal('"A", "B", "C", and "D"');
		});
	});
});
