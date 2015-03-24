/*jslint node:true,nomen:true */
(function(exports){
	var matchObj, matchArray, singleMatch;
	
	singleMatch = function(field,s,text,word) {
		var oneMatch = false, t, re, j, from, to;
		// for numbers, exact match; for strings, ignore-case match; for anything else, no match
		t = typeof(field);
		if (field === null) {
		  oneMatch = s === null;
	  } else if (field === undefined) {
	    oneMatch = s === undefined;
		} else if (t === "boolean") {
			oneMatch = s === field;
		} else if (t === "number") {
			if (s !== null && s !== undefined && typeof(s) === "object" && (s.from !== undefined || s.to !== undefined || s.gt !== undefined || s.lt !== undefined)) {
				from = s.from || s.gt;
				to = s.to || s.lt;
				oneMatch = (s.from !== undefined || s.gt !== undefined ? field >= from : true) && 
										(s.to !== undefined || s.lt !== undefined ? field <= to: true);
			} else {
				oneMatch = field === s;
			}
		} else if (t === "string") {
			if (text) {
				re = new RegExp(s,"i");
			} else if (word) {
				re = new RegExp("(\\s|^)"+s+"(?=\\s|$)","i");
			} else {
				re = new RegExp("^"+s+"$","i");
			}
			oneMatch = field && field.match(re) !== null;
		} else if (t === "boolean") {
			oneMatch = typeof(s) === "boolean" && s === field;
		} else if (field.length !== undefined) {
		  // array, so go through each
		  for (j=0;j<field.length;j++) {
		    oneMatch = singleMatch(field[j],s,text,word);
        if (oneMatch) {
          break;
        }
		  }
		} else if (t === "object") {
		  oneMatch = field[s] !== undefined;
		}
		return(oneMatch);
	};

	matchArray = function(ary,search) {
		var matched = false, i, ret = [];
		if (ary && ary.length > 0) {
			for (i=0;i<ary.length;i++) {
				matched = matchObj(ary[i],search);
				if (matched) {
					ret.push(ary[i]);
				}
			}
		}
		return(ret);
	};
	matchObj = function(obj,search) {
		var i, j, matched, oneMatch, negator, joinAnd, ary, text, word;
		search = search || {};

		// did we have a negator?
		negator = search._not ? true : false;
		// do we join via AND or OR
		joinAnd = search._join && search._join === "OR" ? false : true;
		// if joinAnd, then matched=true until we have a single non-match; if !joinAnd, then matched=false until we have a single match
		matched = joinAnd ? true : false;
		
		// did we have text or word search?
		text = search._text ? true : false;
		word = search._word ? true : false;

		// are we a primitive or a composite?
		if (search.terms) {
			for (j=0; j<search.terms.length; j++) {
				oneMatch = matchObj(obj,search.terms[j]);
				if (negator) {
					oneMatch = !oneMatch;
				}
				// if AND, a single match failure makes all fail, and we break
				// if OR, a single match success makes all succeed, and we break
				if (joinAnd && !oneMatch) {
					matched = false;
					break;
				} else if (!joinAnd && oneMatch) {
					matched = true;
					break;
				}
			}
		} else {
			// match to the search field
			for(i in search) {
				if (search.hasOwnProperty(i) && i.indexOf("_") !== 0) {
          // match each one, if search[i] is an array - just concat to be safe
				  ary = [].concat(search[i]);
			    for (j=0;j<ary.length;j++) {
			      oneMatch = oneMatch = singleMatch(obj[i],ary[j],text,word);
            if (oneMatch) {
              break;
            }
          }
					// negator
					if (negator) {
						oneMatch = !oneMatch;
					}

					// if AND, a single match failure makes all fail, and we break
					// if OR, a single match success makes all succeed, and we break
					if (joinAnd && !oneMatch) {
						matched = false;
						break;
					} else if (!joinAnd && oneMatch) {
						matched = true;
						break;
					}
				}
			}
		}

		return(matched);
	};

	exports.matchArray = matchArray;
	exports.matchObject = matchObj;
}(typeof module === "undefined" || typeof module.exports === "undefined" ? this.SEARCHJS = {} : module.exports));
