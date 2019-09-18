"use strict";
const main = ("object" === typeof global ? global : self);
main.Chinotto = (main.Chinotto || require("./index.js")).register();
if("object" === typeof exports && "undefined" !== typeof module)
	module.exports = main.Chinotto;
