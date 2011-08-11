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

Syntax Definition
------------------
jsql syntax is defined as follows.

There are two kinds of queries:

* Primitives: Primitives match one or more fields on AND or OR, with or without a negation. 
* Composites: Composites join multiple primitives. The primitives are in an array in the field "terms". See examle 7.

Negation: Negation is provided by the field "_not" in the search primitive or composite. If _not === true, then negation is applied
If it does not exist or has any other value, it is ignored. See examples 4,5,6.

Join: Join among multiple fields in a primitive, or multiple terms in a composite. By default, the join is AND. If you want to
use join of OR, add the field _join with the value "OR". See examples 3,6,7.

searchjs
========

Overview
--------
searchjs is the reference implementation of jsql. It uses jsql to check if an object matches a query, or to go through a 
list of objects and return those that match. For now, it uses objects in memory only; in the future, it could be extended
to other data stores.

Installation
------------
In node, install using:

> npm install searchjs

Browser-version is being worked on. There is nothing node-specific about search js.

Next, require it using:
> var s = require('searchjs');

Usage
-----
Make a query. There are two types of searches: matchObject and matchArray.

* matchObject (object,jsqlObject): matchObject returns boolean true or false, depending on whether or not the given object matches the given search. 
* matchArray (array,jsqlObject): matchArray returns an array of items, subset of the passed array, that match match the given search.

All objects are stateless. The following examples show how to use matchObject and matchArray. For more details, look at the test.js
file included with searchjs.

> matches = s.matchObject({name:"John",age:25},{name:"Johnny"}); // returns false
> matches = s.matchArray([{name:"John",age:25},{name:"Jill",age:30}],{name:"John"}); // returns [{name:"John",age:25}]
