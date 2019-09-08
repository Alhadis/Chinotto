import chai       from "chai";
import * as dom   from "./dom.mjs";
import * as fs    from "./filesystem.mjs";
import * as utils from "./utils.mjs";

export default {chai, dom, fs, ...utils, register};


/**
 * Register every available Chai extension.
 * @public
 * @example
 *    import Chinotto from "./lib/index.mjs";
 *    Chinotto.register();
 */
function register(){
	dom.register();
	fs.register();
}
