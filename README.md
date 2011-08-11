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
