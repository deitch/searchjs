jsql
====

Overview
--------
jsql is a JavaScript query language, along with a simple JavaScript objects (POJSO) reference implementation. 

This is not intended to search the dom, or jQuery, or some specific database, nor is it intended to enable using SQL in a browser.
jsql is intended to provide a native JSON query format for querying anything, although initially limited to JavaScript objects.

Reference Implementation
------------------------
The reference implementation, searchjs, uses jsql to query a JS object, or an array of objects, and to return those results that match
the query.

As of version 0.1.1, several enhancements have been added:

1. Record Array Field: If the field in the object is an array, then the match is done to each item in the array, and returns true if one or more matches. See example 8.
2. Matcher Array Value: If the primitive value is an array, then the value in the record field is matched to each element in the array. See example 9.
3. Combine Record Array with Matcher Array: If both the record field value is an array and the matcher value is an array, then it will return true if any one value in the record array matches any one value in the matcher field. See example 10.
4. Negater: The "_not" negater can be used with Record Array and Matcher Array. See example 11.

As of version 0.1.3, several additional enhancements:

5. Record Object Field: If the field in the object is itself an object, then the match is done to each key in the array, and returns true if one or more matches. See example 8.

Examples
--------
Some examples:

1. {name: "John", age: 30} - all records that have name === "John" (ignore-case) && age === 30
2. {_join: "AND", name: "John", age: 30} - all records that have name === "John" (ignore-case) && age === 30 (same as above)
3. {_join: "OR", name: "John", age: 30} - all records that have name === "John" (ignore-case) || age === 30
4. {_not: true, name: "John"} - all records that have name !== "John" (ignore-case)
5. {_not: true, name: "John", age: 30} - all records that have name !== "John" (ignore-case) AND age !== 30
6. {_not: true, _join: "OR", name: "John", age: 30} - all records that have name !== "John" (ignore-case) OR age !== 30
7. {_join: "OR", terms: [{name:"John", age:30},{age:35}]} - all records that have (name === "John" && age === 30) || (age === 35)
8. {email: "john@foo.com"} - all records that have the email === "john@foo.com", if the record has email as a string; or if email is an array, then each element is checked; or if email is an object, then the keys are checked. All of the following will match: {email:"john@foo.com"} and {email:["john@foo.com","js@gmail.com"]} and {email:{"john@foo.com":true}}
9. {name:["John","Jill"]} - all records that have name === "John" || name === "Jill"
10. {email:["john@foo.com","jf@gmail.com"]} - all records that have email === "john@foo.com" || email === "jf@gmail.com" OR email in the record is an array, and at least one value in that array is "john@foo.com" or "jf@gmail.com"
11. {_not: true, name:["John","Jill"]} - all records that have name !== "John" && name !== "Jill"
12. {_not:true, email:["john@foo.com","jf@gmail.com"]} - all records that have (email !== "john@foo.com" && email !== "jf@gmail.com") OR email in the record is an array, and not one single value in that array is "john@foo.com" or "jf@gmail.com"

Syntax Definition
------------------
jsql syntax is defined as follows.

There are two kinds of queries:

* Primitives: Primitives match one or more fields on AND or OR, with or without a negation. 
* Composites: Composites join multiple primitives. The primitives are in an array in the field "terms". See example 7.

Negation: Negation is provided by the field "_not" in the search primitive or composite. If _not === true, then negation is applied
If it does not exist or has any other value, it is ignored. See examples 4,5,6.

Join: Join among multiple fields in a primitive, or multiple terms in a composite. By default, the join is AND. If you want to
use join of OR, add the field _join with the value "OR". See examples 3,6,7.

Text Searching
--------------
In general, if you search a field that is a string, and the search primitive is a string, then it will be an exact match.

`{name:"davi"}` will match a record whose content is `{name:"davi"}` but not one whose content is `{name:"david"}` or even `{name: "davi abc"}`. However, all string searches will ignore case, so it will also match `{name:"Davi"}` and `{name:"DAVI"}`.

There are two variants on text search that can expand your ability to search text fields:

1. substring: if you set the flag `{_text: true}` as part of your search, then it searches for your match *as part of the field*. In other words, if your search is `{name:"davi", _text:true}` then it will check if the field matches `/davi/i`.
2. word: if you set the flag `{_word: true}` as part of your search, then it search for your match *as a complete word in the field*. In other words, if your search is `{name:"davi",_word:true}` then it will check if the field matches `/\bdavi\b/i`.

The `_text` option will override the `_word` option if both exist.

Here are some more examples on text searching:

* `{name:"davi"}` matches all of `{name:"davi"}, {name:"DAvi"}` but none of `{name:"david"}, {name:"abc davi def"}`
* `{name:"davi",_word:true}` matches all of `{name:"davi"}, {name:"DAvi"}, {name:"abc davi def"}` but none of `{name:"david"}`
* `{name:"davi",_text:true}` matches all of `{name:"davi"}, {name:"DAvi"}, {name:"abc davi def"}, {name:"abdavideq"}`


searchjs
========

Overview
--------
searchjs is the reference implementation of jsql. It uses jsql to check if an object matches a query, or to go through a 
list of objects and return those that match. For now, it uses objects in memory only; in the future, it could be extended
to other data stores.

Installation & Usage
--------------------

## Node
In node, install using:

	npm install searchjs

Browser-version is being worked on. There is nothing node-specific about search js.

Next, require it using:
	var s = require('searchjs');

Make a query. There are two types of searches: matchObject and matchArray.

* matchObject (object,jsqlObject): matchObject returns boolean true or false, depending on whether or not the given object matches the given search. 
* matchArray (array,jsqlObject): matchArray returns an array of items, subset of the passed array, that match match the given search.

All objects are stateless. The following examples show how to use matchObject and matchArray. For more details, look at the test.js
file included with searchjs.

	matches = s.matchObject({name:"John",age:25},{name:"Johnny"}); // returns false
	matches = s.matchArray([{name:"John",age:25},{name:"Jill",age:30}],{name:"John"}); // returns [{name:"John",age:25}]

## Browser
In the browser, you simply need to include the file lib/search.js. Download it from github (where you are probably reading this)
and include it in your path. Lots of libraries do require() and inclusion, but the raw, basic way to do it is:

	<script src="lib/searchjs.js"></script>

This will make a global variable SEARCHJS in your window. You can then use it as above:

	matches = SEARCHJS.matchObject({name:"John",age:25},{name:"Johnny"}); // returns false
	matches = SEARCHJS.matchArray([{name:"John",age:25},{name:"Jill",age:30}],{name:"John"}); // returns [{name:"John",age:25}]
