/*jslint node:true,nomen:true */
(function(exports){
  var matchObj, _matchObj, _getOptions, matchArray, singleMatch, deepField;

  // returns the item in the object that matches an array path.
  deepField = function(data, propertyPath) {
    // If it is an Array we have to check all the items for the value
    //if (data.constructor.name == 'Array') {
    if (Array.isArray(data)) {

      // Go through each of the items and return the value of the first one that has it
      var dataArrayLength = data.length;
      for (var i=0;i<dataArrayLength;i++) {
        // We copy the value because it is just a reference the first round would delete it and the second one would
        // not know anymore what to look for
        var copyPropertyPath = propertyPath.slice(0);

        // First try to find the value
        var itemValue = deepField(data[i], copyPropertyPath);

        // We use and return the value of the first item that has it set
        if (itemValue) {
          return itemValue;
        }
      }
    } else {
      // It is not an array so we can proceed normally

      // Get the first parameter
      var parameter = propertyPath[0];

      if (!data.hasOwnProperty(parameter)) {
        // If parameter does not exist we directly return
        return undefined;
      }

      if (propertyPath.length < 2) {
        // If the current one was the last parameter parts left we can directly return
        return data[parameter];
      } else {
        // If there are more parts left we go on with the search

        // We get rid of the first parameter
        // (We do not have to copy it because the Array should have been create newly when a string got used as
        // original input for the function. So we can cut it down without any problem.)
        propertyPath.shift();
        return deepField(data[parameter], propertyPath)
      }
    }

    return undefined;
  };

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
      if (typeof(s) === "string") {
        s = s.toLowerCase();
      }
      field = field.toLowerCase();
      if (text) {
        oneMatch = field.indexOf(s) !== -1;
      } else if (word) {
        var re = new RegExp("(\\s|^)"+s+"(?=\\s|$)");
        oneMatch = field && field.match(re) !== null;
      } else {
        oneMatch = s === field;
      }
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

    var options = _getOptions(search);

    if (ary && ary.length > 0) {
      for (i=0;i<ary.length;i++) {
        matched = _matchObj(ary[i],search,options);
        if (matched) {
          ret.push(ary[i]);
        }
      }
    }
    return(ret);
  };

  _getOptions = function(search) {
    var options = {};

    search = search || {};

    // did we have a negator?
    options.negator = search._not ? true : false;
    // do we join via AND or OR
    options.joinAnd = search._join && search._join === "OR" ? false : true;

    // did we have text or word search?
    options.text = search._text ? true : false;
    options.word = search._word ? true : false;
    options.separator = search._separator || '.';

    return options;
  }

  matchObj = function(obj,search) {
    var options = _getOptions(search);
    return _matchObj(obj,search,options);
  };

  _matchObj = function(obj,search,options) {
    var j, oneMatch, ary;
    var matched = options.joinAnd ? true : false;

    // are we a primitive or a composite?
    if (search.terms) {
      for (j=0; j<search.terms.length; j++) {
        oneMatch = _matchObj(obj,search.terms[j],options);
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
      for(var searchTerm in search) {
        var searchTermParts = searchTerm.split(options.separator);

        if (search.hasOwnProperty(searchTerm) && searchTerm.indexOf("_") !== 0) {
          // match each one, if search[searchTerm] is an array - just concat to be safe
          ary = [].concat(search[searchTerm]);
          for (j=0;j<ary.length;j++) {
            oneMatch = oneMatch = singleMatch(deepField(obj,searchTermParts),ary[j],options.text,options.word);
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
  };

  exports.matchArray = matchArray;
  exports.matchObject = matchObj;
  exports.deepField = deepField;
}(typeof module === "undefined" || typeof module.exports === "undefined" ? this.SEARCHJS = {} : module.exports));
