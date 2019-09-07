import chai from "chai";
import {addMethod, addProperty, flattenList, formatList} from "./utils.mjs";


export function register(){
	for(const [names, fn] of methods)    addMethod(names, fn);
	for(const [names, fn] of properties) addProperty(names, fn);
}


export const methods = new Map([
	
	/**
	 * Check if an {@link HTMLElement} contains one or more CSS classes.
	 *
	 * @function class
	 * @alias    classes
	 * @param    {...(String|String[])} expected
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
]);


export const properties = new Map([
	
	/**
	 * Assert that an {@link HTMLElement} is rendered in the DOM tree.
	 * @name      drawn
	 * @memberof! chai.Assertion.prototype
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
	 * @name      focus
	 * @memberof! chai.Assertion.prototype
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
]);
