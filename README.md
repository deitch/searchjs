# jsql

## Overview
jsql is a JavaScript query language, along with a simple JavaScript objects (POJSO) reference implementation. 

This is not intended to search the dom, or jQuery, or some specific database, nor is it intended to enable using SQL in a browser.
jsql is intended to provide a native JSON query format for querying anything, although initially limited to JavaScript objects.

## Reference Implementation
The reference implementation, searchjs, uses jsql to query a JS object, or an array of objects, and to return those results that match
the query.


## Syntax Definition
jsql syntax is defined as follows.

jsql *always* is a single JavaScript object: `{}` with properties that determine the parameters for the query.

There are three kinds of properties for a query:

* Primitives: Primitives match one or more fields on AND or OR, with or without a negation. 
* Modifiers: Modifiers determine how the other properties are treated: negation, field join type, ranges and text searches.
* Composites: Composites join multiple primitives. The primitives are in an array in the field "terms". See example 7.

### Primitives
A primitive is an object with properties that are matched. 

* `{name:"John"}` - primitive that checks that the name field is equal to "John"

Multiple fields in a primitive are, by default, joined by logical AND. See under Modifiers to change this.

* `{name:"John",age:30}` - primitive that checks that the name field is equal to "John" AND that the age field is equal to 30

The name of a field in a primitive is *always* the name of the field to match in the record. The value can be one of:

* Basic types: string, number - will match directly against the value in the record. Case is **ignored** in string matches.
* Array: will match against any one of the values in the array. See below.
* Object: will look for a range. See below.

#### Array Primitive
If the value of a field in a primitive is an array, then it will accept a match of any one of the array values. 

````JavaScript
{name:["John","Jack"]} // accepts any record where the name field matches 'John' or 'Jack'
{_join:"OR",terms:[{name:"John"},{name:"Jack"}]} // equivalent to the previous
````

Additionally, if the target record also has an array, it will accept a match if *any one* of the values in the array of the record matches *any one* of the values in the array of the search term.

````JavaScript
{name:["John","Jack"]}
````

will match any of these:

````JavaScript
{name:"John",phone:"+12125551212"}
{name:"Jack",location:"Canada"}
{name:["John","Jim"],company:"Hot Startup"}
````

#### Range
If the value of a field in a primitive is an object with "from" or "to" or "gt" or "lt" fields, then it will treat it as a range.

````JavaScript
{age:{from:30}}  // accepts any age >=30
{age:{gt:30}}  // accepts any age >=30
{age:{to:80}}    // accepts any age <=80
{age:{lt:80}}    // accepts any age <=80
{age:{from:30,to:80}}  // accepts any age from 30 to 80 (inclusive)
{_not:true,age:{from:30}} // accepts any age <30
{age:{nothing:"foo"}}  // ignored
````

Accept values in `to` and `from` fields in a range are numbers and strings. The type of the target record's data **must** match the type of the value of `from` and `to`. If not, it is treated as unmatched. You **cannot** match `{age:{from:30}}` to a record `{age:"veryold"}`!

Note that "gt" and "from", and "lt" and "to", are interchangeable. Yes, it should be that "gte" is equivalent to "from" (>=) while "gt" is equivalent to ">", but we aren't there yet.


### Modifiers
Modifiers change the search term of a primitive.

#### Negation
Negation just sets the opposite. Instead of checking if the "name" field equals "John", you can check if it does *not* equal "John":

````JavaScript
{name:"John",_not:true}   // match all records in which name !== "John"
````

Just add the field `_not` to the primitive and set it to `true`. If the `_not` field does not exist, or is set to `false` or `null`, it will be ignored.

#### Join
Join determines how multiple fields are put together. Instead of checking if "name" equals "John" AND "age" equals 30, you can check if "name" equals "John" OR "age" equals 30:

````JavaScript
{name:"John",age:30,_join:"OR"}   // match all records in which name === "John" || age === 30
````

Just add the field `_join` to the primitive and set it to "OR". If the `_join` field does not exist, or is set to "AND", it will join the field in "AND".


#### Text Searching
In general, if you search a field that is a string, and the search primitive is a string, then it will be an exact match, ignoring case.

`{name:"davi"}` will match a record whose content is `{name:"davi"}`, as well as one whose "name" field matches "Davi" and "DAVID", but not one whose content is `{name:"david"}` or even `{name: "davi abc"}`.

If you want a text search that can do partial matches, text searching is here to help!

There are two variants on text search that can expand your ability to search text fields:

1. substring: if you set the flag `{_text: true}` as part of your search, then it searches for your match *as part of the field*. In other words, if your search is `{name:"davi", _text:true}` then it will check if the field matches `/davi/i`.
2. word: if you set the flag `{_word: true}` as part of your search, then it search for your match *as a complete word in the field*. In other words, if your search is `{name:"davi",_word:true}` then it will check if the field matches `/\bdavi\b/i`.

The `_text` option will override the `_word` option if both exist.

Here are some examples of text searching:

* `{name:"davi"}` matches all of `{name:"davi"}, {name:"DAvi"}` but none of `{name:"david"}, {name:"abc davi def"}`
* `{name:"davi",_word:true}` matches all of `{name:"davi"}, {name:"DAvi"}, {name:"abc davi def"}` but none of `{name:"david"}`
* `{name:"davi",_text:true}` matches all of `{name:"davi"}, {name:"DAvi"}, {name:"abc davi def"}, {name:"abdavideq"}`


### Composites
If you want to combine multiple composites into a single search term, you put them in an array, name it "terms", and create a composite search term. You can search for ("name" equals "John" and age equals 30) OR ("name" equals "Jill" and "location" equals "Canada"):

````JavaScript
{_join:"OR",terms:[{name:"John",age:30},{name:"Jill",location:"Canada"}]}
````

Composities can be layered inside composites, since each term in `terms` can itself be a composite.

## Examples

1. `{name: "John", age: 30}` - all records that have name === "John" (ignore-case) && age === 30
2. `{_join: "AND", name: "John", age: 30}` - all records that have name === "John" (ignore-case) && age === 30 (same as above)
3. `{_join: "OR", name: "John", age: 30}` - all records that have name === "John" (ignore-case) || age === 30
4. `{_not: true, name: "John"}` - all records that have name !== "John" (ignore-case)
5. `{_not: true, name: "John", age: 30}` - all records that have name !== "John" (ignore-case) AND age !== 30
6. `{_not: true, _join: "OR", name: "John", age: 30}` - all records that have name !== "John" (ignore-case) OR age !== 30
7. `{_join: "OR", terms: [{name:"John", age:30},{age:35}]}` - all records that have (name === "John" && age === 30) || (age === 35)
8. `{email: "john@foo.com"}` - all records that have the email === "john@foo.com", if the record has email as a string; or if email is an array, then each element is checked; or if email is an object, then the keys are checked. All of the following will match: `{email:"john@foo.com"}` and `{email:["john@foo.com","js@gmail.com"]}` and `{email:{"john@foo.com":true}}`
9. `{name:["John","Jill"]}` - all records that have name === "John" || name === "Jill"
10. `{email:["john@foo.com","jf@gmail.com"]}` - all records that have email === "john@foo.com" || email === "jf@gmail.com" OR email in the record is an array, and at least one value in that array is "john@foo.com" or "jf@gmail.com"
11. `{_not: true, name:["John","Jill"]}` - all records that have name !== "John" && name !== "Jill"
12. `{_not:true, email:["john@foo.com","jf@gmail.com"]}` - all records that have (email !== "john@foo.com" && email !== "jf@gmail.com") OR email in the record is an array, and not one single value in that array is "john@foo.com" or "jf@gmail.com"
13. `{age: 30}` - all records that have age === 30
14. `{age: 30, _not: true}` - all records that have age !== 30
14. `{age: {from:30, to:35}}` - all records that have age >= 30 && age <=35
14. `{age: {gt:30, lt:35}}` - all records that have age >= 30 && age <=35
14. `{_not: true, age: {from:30, to:35}}` - all records that have age !(>= 30 && age <=35) i.e. age < 30 || age > 35
15. `{name: "John", age: {from:30, to:35}}` - all records that have name === "John" && age >= 30 && age <=35
15. `{_not: true, name: "John", age: {from:30, to:35}}` - all records that have name !== "John" && age !(>= 30 && age <=35)
15. `{terms:[{name: "John"}, {_not: true, age: {from:30, to:35}}]}` - all records that have name === "John" && age !(>= 30 && age <=35)


# searchjs

## Overview
searchjs is the reference implementation of jsql. It uses jsql to check if an object matches a query, or to go through a 
list of objects and return those that match. For now, it uses objects in memory only; in the future, it could be extended
to other data stores.

## Installation & Usage

### Node
In node, install using:

	npm install searchjs

Browser-version is being worked on. There is nothing node-specific about search js.

Next, require it using:
	var s = require('searchjs');

Make a query. There are two types of searches: matchObject and matchArray.

* `matchObject(object,jsqlObject)`: matchObject returns boolean true or false, depending on whether or not the given object matches the given search. 
* `matchArray(array,jsqlObject)`: matchArray returns an array of items, subset of the passed array, that match match the given search.

All objects are stateless. The following examples show how to use matchObject and matchArray. For more details, look at the test.js
file included with searchjs.

````JavaScript
var list = [{name:"John",age:25},{name:"Jill",age:30}];
matches = s.matchObject(list[0],{name:"Johnny"}); // returns false
matches = s.matchArray(list,{name:"John"}); // returns [{name:"John",age:25}]
````


### Browser
In the browser, you simply need to include the file lib/search.js. Download it from github (where you are probably reading this)
and include it in your path. Lots of libraries do require() and inclusion, but the raw, basic way to do it is:

	<script src="lib/searchjs.js"></script>

This will make a global variable SEARCHJS in your window. You can then use it as above:

````JavaScript
var list = [{name:"John",age:25},{name:"Jill",age:30}];
matches = SEARCHJS.matchObject(list[0],{name:"Johnny"}); // returns false
matches = SEARCHJS.matchArray(list,{name:"John"}); // returns [{name:"John",age:25}]
````

## Changelist
Version 0.3.0 adds support for query ranges. You can query `{age: {from:25,to:30}}`

As of version 0.1.1, several enhancements have been added:

1. Record Array Field: If the field in the object is an array, then the match is done to each item in the array, and returns true if one or more matches. See example 8.
2. Matcher Array Value: If the primitive value is an array, then the value in the record field is matched to each element in the array. See example 9.
3. Combine Record Array with Matcher Array: If both the record field value is an array and the matcher value is an array, then it will return true if any one value in the record array matches any one value in the matcher field. See example 10.
4. Negater: The "_not" negater can be used with Record Array and Matcher Array. See example 11.

As of version 0.1.3, several additional enhancements:

5. Record Object Field: If the field in the object is itself an object, then the match is done to each key in the array, and returns true if one or more matches. See example 8.

