#!/usr/bin/env node
"use strict";

const {readFileSync, writeFileSync} = require("fs");
const {join, resolve} = require("path");


/**
 * @fileoverview
 * An ad hoc, hacky, inflexible stop-gap for generating an API reference
 * for the readme from JSDoc. Will be nuked in favour of something clean
 * and sensible at some point in the distant future.
 *
 * FIXME: Nuke this crap from orbit.
 */

new Promise(resolve => {
	let input = "";
	process.stdin.setEncoding("utf8");
	process.stdin.on("readable", () => {
		const chunk = process.stdin.read();
		null !== chunk ? input += chunk : resolve(input);
	});
}).then(data => {
	data = JSON.parse(data).filter(doclet => !doclet.undocumented);
	
	const namespaces = {};
	for(const doclet of data){
		const {memberof, kind, name} = doclet;
		if("Chinotto" === memberof && "namespace" === kind && !namespaces[name])
			namespaces[name] = Object.defineProperties(new Map(), {doclet: {value: doclet}});
	}

	for(const doclet of data){
		let ns = doclet.memberof;
		if(!ns) continue;
		
		// Ignore symbols marked as internal/private
		if(/^(?:private|internal)$/.test(doclet.access || ""))
			continue;
		
		ns = (ns || "").replace(/^module:Chinotto\./, "");
		ns = namespaces[ns];
		if(ns){
			const names     = [doclet.name, doclet.alias].filter(Boolean);
			const addPunct  = name => ns && ns === namespaces.Properties ? `.${name}` : `${name}()`;
			let firstSlug   = "";
			const titleText = names.map(addPunct).join(", ");
			const titleHTML = "<h4>" + names.map(name => {
				const slug = slugify(name);
				if(!firstSlug) firstSlug = slug;
				return `<code><a name="${slug}">${escapeHTML(addPunct(name))}</a></code>`;
			}).join("/") + "</h4>";
			ns.set(firstSlug, {doclet, permalink: firstSlug, titleText, titleHTML});
		}
	}
	
	let output = "";
	output += formatExtList(namespaces);
	output += formatExports(namespaces);
	output += formatSection(namespaces, "Methods", false);
	output += formatSection(namespaces, "Properties", false);
	output += formatSection(namespaces, "Utils", false);
	output = output.replace(/\n{2,}/g, "\n\n");
	
	const readmePath = resolve(join(__dirname, "..", "README.md"));
	let readme = readFileSync(readmePath, "utf8");
	readme = readme.replace(/(\n<!-- Begin JSDoc -->\n).*$/s, "$1\n");
	readme += output;
	writeFileSync(readmePath, readme);
});


function formatExtList(sections){
	let output = "<h3>Extension list</h3>\n\n";
	for(const name of "Methods Properties".split(" ")){
		output += `* [${name}](#${name.toLowerCase()})\n`;
		for(const {permalink, titleText} of [...sections[name].values()].sort((a, b) => a.permalink.localeCompare(b.permalink)))
			output += `\t* [\`${titleText.split(/, /).shift()}\`](#${permalink})\n`;
	}
	output += "\n\n";
	return output;
}


function formatExports(sections){
	const {Exports, Utils} = sections;
	let output = "<h3>Exports</h3>\n\n";
	
	const props = new Map(Exports.doclet.properties.map(x => [x.name, x]));
	for(const key of [...props.keys()].sort()){
		const value = props.get(key);
		let type = value.type.names;
		type = /^Map/.test(type.join(","))
			? "[`Map`](https://mdn.io/Map)"
			: formatType(...type);
		output += `* \`${value.name}\`: ${type}`;
		if(value.description)
			output += " — " + value.description;
		output += "\n";
	}
	
	output += "\nThe remaining exports are detailed under [Utils](#utils):\n";
	const utils = [...Utils.values()].sort((a, b) => a.permalink.localeCompare(b.permalink));
	for(const {permalink, titleText} of utils)
		output += `* [\`${titleText}\`](#${permalink})\n`;
	output += "\n\n";
	return output;
}


function formatSection(sections, name, useFold = true){
	const sect = sections[name] || sections[String(name).toLowerCase()];
	const head = useFold
		? `<details><summary><b>${name}</b></summary>`
		: `<h3>${name}</h3>`;
	let output = [head, "", formatDesc(sect.description)].join("\n");
	for(const [, value] of sect){
		output += `${value.titleHTML}\n\n`;
		const {description, params, examples} = value.doclet;
		output += `${formatDesc(description)}\n\n`;
		if(Array.isArray(params) && params.length)
			output += formatParams(params);
		
		if(examples && examples.length){
			const sep = "~~~";
			const src = examples.map(x => deindent(x)).join("\n\n");
			output += "\n\n**Example:**  \n";
			output += `${sep}js\n${src}\n${sep}\n\n`;
		}
	}
	if(useFold)
		output += "\n\n</details>\n\n";
	return output;
}


function formatParams(params){
	const noAttr = params.every(x => !(x.optional || x.variable || ("defaultvalue" in x)));
	const noDesc = params.every(x => !x.description);
	let output = "";
	output += '<table width="100%"><thead><tr><th>Parameter</th><th>Type</th>';
	if(!noAttr) output += "<th>Attributes</th>";
	if(!noDesc) output += "<th>Description</th>";
	output += "</tr></thead>\n";
	output += params.map(x => {
		let row = "<tbody><tr>\n";
		row += `\t<td valign="top"><code>${x.name}</code></td>\n`;
		row += `\t<td valign="top">${formatType(...x.type.names)}</td>\n`;
		if(!noAttr) row += `\t<td valign="top">${formatAttr(x)}</td>\n`;
		if(!noDesc) row += `\t<td valign="top">${formatDesc(x.description)}</td>\n`;
		row += "</tr></tbody>\n";
		return row;
	}).join("\n");
	output += "</table>\n\n";
	return output;
}


function formatAttr(param){
	const output = [];
	if("defaultvalue" in param)
		output.push(`<i>Default: <code>${param.defaultvalue}</code></i>`);
	param.optional && output.push("<i>Optional</i>");
	param.variable && output.push("<i>Variadic</i>");
	return output.join(", ");
}


function formatType(...types){
	return types
		.map(s => `<code>${s.replace(/[A-Z$_][$\w]+/g, s => "function" === typeof global[s]
			? `<a href="https://mdn.io/${s}">${s}</a>`
			: `<a href="#${slugify(s)}">${s}</a>`)}</code>`)
		.join(", ");
}

function formatDesc(input){
	if(!input) return "";
	return escapeHTML(input)
		.replace(/(?:\[([^\]]+)\])?{@link ([^}]+)}/g, (_, text, dest) => {
			text = text
				? text.replace(/^`([^`]+)`$/g, "<code>$1</code>")
				: dest.replace(/^#/, "");
			if(!dest.match(/^#/)){
				dest = "https://mdn.io/" + dest;
				if(!text.match(/^<code>/))
					text = "<code>" + text + "</code>";
			}
			return `<a href="${dest}">${text}</a>`;
		});
}


function escapeHTML(input){
	return input.replace(/[<&'">]/g, char => `&#${char.charCodeAt(0)};`);
}

function slugify(input){
	return /^([a-z]+[A-Z])+[a-z]+$/.test(input)
		? input.replace(/([a-z]+)([A-Z])/g, (_, a, B) => `${a}-${B}`).toLowerCase()
		: input;
}


function deindent(input, ...args){
	
	// Avoid breaking on String.raw if called as an ordinary function
	if("object" !== typeof input || "object" !== typeof input.raw)
		return deindent `${input}`;
	
	const depthTable = [];
	let maxDepth = Number.NEGATIVE_INFINITY;
	let minDepth = Number.POSITIVE_INFINITY;
	
	// Normalise newlines and strip leading or trailing blank lines
	const chunk = String.raw.call(null, input, ...args)
		.replace(/\r(\n?)/g, "$1")
		.replace(/^(?:[ \t]*\n)+|(?:\n[ \t]*)+$/g, "");

	for(const line of chunk.split(/\n/)){
		// Ignore whitespace-only lines
		if(!/\S/.test(line)) continue;
		
		const indentString = line.match(/^[ \t]*(?=\S|$)/)[0];
		const indentLength = indentString.replace(/\t/g, " ".repeat(8)).length;
		if(indentLength < 1) continue;

		const depthStrings = depthTable[indentLength] || [];
		depthStrings.push(indentString);
		maxDepth = Math.max(maxDepth, indentLength);
		minDepth = Math.min(minDepth, indentLength);
		if(!depthTable[indentLength])
			depthTable[indentLength] = depthStrings;
	}

	if(maxDepth < 1)
		return chunk;
	
	const depthStrings = new Set();
	for(const column of depthTable.slice(0, minDepth + 1)){
		if(!column) continue;
		depthStrings.add(...column);
	}
	depthStrings.delete(undefined);
	const stripPattern = [...depthStrings].reverse().join("|");
	return chunk.replace(new RegExp(`^(?:${stripPattern})`, "gm"), "");
}
