import {toType, deepField} from './util';

export var _defaults = {};

// Allows to overwrite the global default values
export function setDefaults(options) {
	for (const key in options) {
		_defaults[key] = options[key];
	}
}

export function resetDefaults() {
	_defaults = {};
}

export function singleMatch(field,s,text,word,start,end) {
	let oneMatch = false, t, re, j, from, to;
	// for numbers, exact match; for strings, ignore-case match; for anything else, no match
	t = typeof(field);
	if (field === null) {
		oneMatch = s === null;
	} else if (field === undefined) {
		oneMatch = s === undefined;
	} else if (t === "boolean") {
		oneMatch = s === field;
	} else if (t === "number" || field instanceof Date) {
		if(s !== null && s !== undefined && toType(s) === "object") {
			if (s.from !== undefined || s.to !== undefined || s.gte !== undefined || s.lte !== undefined) {
				from = s.from || s.gte;
				to = s.to || s.lte;
				oneMatch = (s.from !== undefined || s.gte !== undefined ? field >= from : true) &&
					(s.to !== undefined || s.lte !== undefined ? field <= to: true);
			} else if (s.gt !== undefined || s.lt !== undefined) {
				oneMatch = (s.gt !== undefined ? field > s.gt : true) &&
					(s.lt !== undefined ? field < s.lt: true);
			}
		} else {
			if(field instanceof Date && s instanceof Date) {
				oneMatch = field.getTime() === s.getTime();
			} else {
				oneMatch = field === s;
			}

		}
	} else if (t === "string") {
		if (typeof(s) === "string") {
			s = s.toLowerCase();
		}
		field = field.toLowerCase();
		if (text) {
			oneMatch = field.indexOf(s) !== -1;
		} else if (word) {
			re = new RegExp("(\\s|^)"+s+"(?=\\s|$)","i");
			oneMatch = field && field.match(re) !== null;
		} else if (start) {
			re = new RegExp("^"+s, "i");
			oneMatch = field && field.match(re) !== null;
		} else if (end) {
			re = new RegExp(s+"$" , "i");
			oneMatch = field && field.match(re) !== null;
		} else {
			oneMatch = s === field;
		}
	} else if (t === "boolean") {
		oneMatch = typeof(s) === "boolean" && s === field;
	} else if (field.length !== undefined) {
	  // array, so go through each
	  for (j=0;j<field.length;j++) {
		oneMatch = singleMatch(field[j],s,text,word,start,end);
	if (oneMatch) {
	  break;
	}
	  }
	} else if (t === "object") {
	  oneMatch = field[s] !== undefined;
	}
	return(oneMatch);
}

export function matchArray(ary,search) {
	let matched = false, i, ret = [], options = _getOptions(search);
	if (ary && ary.length > 0) {
		for (i=0;i<ary.length;i++) {
			matched = _matchObj(ary[i],search,options);
			if (matched) {
				ret.push(ary[i]);
			}
		}
	}
	return(ret);
}

export function matchObject(obj,search) {
	const options = _getOptions(search);
	return _matchObj(obj,search,options);
}

function _getSingleOpt(first,override,fallback) {
	let ret;
	if (first !== undefined) {
		ret = first;
	} else if (override !== undefined) {
		ret = override;
	} else {
		ret = fallback;
	}
	return ret;
}

function _getOptions(search) {
const options = {};

search = search || {};

// did we have a negator?
//options.negator = search._not ? true : _defaults.negator || false;
options.negator = _getSingleOpt(search._not,_defaults.negator,false);
// do we join via AND or OR
//options.joinAnd = search._join && search._join === "OR" ? false : _defaults.join || true;
options.joinAnd = _getSingleOpt(search._join, _defaults.join, "AND") !== "OR";

// did we have text, word, start or end search?
options.text = _getSingleOpt(search._text,_defaults.text,false);
options.word = _getSingleOpt(search._word,_defaults.word,false);
options.start = _getSingleOpt(search._start,_defaults.start,false);
options.end = _getSingleOpt(search._end,_defaults.end,false);

options.separator = search._separator || _defaults.separator || '.';
options.propertySearch = _getSingleOpt(search._propertySearch,_defaults.propertySearch,false);
options.propertySearchDepth = _getSingleOpt(search._propertySearchDepth,_defaults.propertySearchDepth,-1);


return options;
}

function _matchObj(obj,search,options) {
	let i, j, matched, oneMatch, ary, searchTermParts;
	search = search || {};

	// if joinAnd, then matched=true until we have a single non-match; if !joinAnd, then matched=false until we have a single match
	matched = !!options.joinAnd;

	// are we a primitive or a composite?
	if (search.terms) {
		for (j=0; j<search.terms.length; j++) {
			oneMatch = matchObject(obj,search.terms[j]);
			if (options.negator) {
				oneMatch = !oneMatch;
			}
			// if AND, a single match failure makes all fail, and we break
			// if OR, a single match success makes all succeed, and we break
			if (options.joinAnd && !oneMatch) {
				matched = false;
				break;
			} else if (!options.joinAnd && oneMatch) {
				matched = true;
				break;
			}
		}
	} else {
		// match to the search field
		for(i in search) {
			if (search.hasOwnProperty(i) && i.indexOf("_") !== 0) {
	  // match each one, if search[i] is an array - just concat to be safe
				searchTermParts = i.split(options.separator);
			  ary = [].concat(search[i]);
			for (j=0;j<ary.length;j++) {
					oneMatch = singleMatch(deepField(obj,searchTermParts,options.propertySearch,options.propertySearchDepth),ary[j],options.text,options.word,options.start,options.end);
		if (oneMatch) {
		  break;
		}
	  }
				// negator
				if (options.negator) {
					oneMatch = !oneMatch;
				}

				// if AND, a single match failure makes all fail, and we break
				// if OR, a single match success makes all succeed, and we break
				if (options.joinAnd && !oneMatch) {
					matched = false;
					break;
				} else if (!options.joinAnd && oneMatch) {
					matched = true;
					break;
				}
			}
		}
	}
	return(matched);
}
