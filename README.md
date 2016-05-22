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

Primitives will search against individual values and against one or more matches in an array. So the search `{name:"John"}` will match against any of the following objects:

* `{name:"John"}`
* `{name:["John","jim"]}`
* `{name:["jim","John"]}`


#### Deep Searching

You are not limited to searching only at the top level. You also can do deep searching on an object of an object using dot-notation. So if you want to match on the object `{city: {Montreal: true}}` then you can search:

````JavaScript
{"city.Montreal": true}
````

The above is a search primitive that checks that the field "city" has an object as its value, which in turn has a key "Montreal" with a value of `true`. You can go as deep as you want. The following is a completely valid deep-search primitive:

````JavaScript
{"country.province.city.street":"Dorchester Blvd"}
````

Any modifiers that apply to simple primitives apply to deep fields as well.

#### Deep Searching Arrays

Deep searching is not limited to objects embedded in objects. You can have arrays of objects embedded in objects. You even can have arrays of objects embedded in arrays of objects embedded in... (you get the idea!).

Thus, the search primitive `{"name.cars.hp":{from:200}}` will match any of the following:

* `{cars: {brand: 'porsche',hp:450}}`
* `{cars: [{brand: 'bmw',hp:250},{brand: 'lada',hp:10}]}` matches the 'bmw' but not the 'lada', therefore the whole object matches


#### Property Search


If you are not sure in which level a specific property can be found you can
use the `propertySearch` modifier. It checks on each level if a property exists
and then checks if it matches.

The following search would find the item below:
````JavaScript
{"name":"tom", _propertySearch:true}
````

Item:
````JavaScript
{"level1":{"level2":{"level3":{name: "tom"}}}}
````

This works also in combination with `Deep Search`.

It is possible to omit any level in between. So all the following queries will
match the above item.

````JavaScript
{"name":"tom", "_propertySearch": true}
{"level1.name":"tom", "_propertySearch": true}
{"level1.level2.name":"tom", "_propertySearch": true}
{"level4.name":"tom", "_propertySearch": true}
{"level1.level4.name":"tom", "_propertySearch": true},
{"name":"tom", "_propertySearch": true, "_propertySearchDepth": 4}
{"level1.name":"tom", "_propertySearch": true, "_propertySearchDepth": 4}
````

It is also possible *and often recommended* to limit the search depth. The following query would match
the above item:

````JavaScript
{"name": "tom", "_propertySearch": true, "_propertySearchDepth": 4}
````

However this one would not because it stops the search one level before:

````JavaScript
{"name":"tom", "_propertySearch": true, "_propertySearchDepth": 3}
````

searchjs normally matches exactly the objects and depths you provide. With Property Searching, it is possible, especially on a large data set, to spend a *lot* of time (and CPU and memory) searching. We strongly recommend limiting the `propertySearchDepth` unless you know the data set with which you are working is limited.


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

#### Deep Search Separator

As described above, you can search deep objects using dot notation. `{"city.Montreal": true}` will match an object `{city: {Montreal: true}}`.

However, what if you do *not* want the '.' character to be your separator? For example, what if your object key itself has a dot?

`{"city.Montreal": "bagels"}`

If you try to match it with a search `{"city.Montreal": "bagels"}`, it will look for `{city: {Montreal: "bagels"}}`, which is not what you have?

You can change the separator from '.' to any other character that makes you happy. Enter the search term as follows:

`{"city:Montreal": "bagels", _separator: ':'}` will match {city: {Montreal: "bagels"}}


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

Make a query. There are three types of searches: object, array of objects, and single value.

* `matchObject(object,jsqlObject)`: matchObject returns boolean true or false, depending on whether or not the given object matches the given search. 
* `matchArray(array,jsqlObject)`: matchArray returns an array of items, subset of the passed array, that match match the given search.
* `matchField(value,comparator,text,word)`: check if a single `value` matches a given comparator. 

All objects are stateless. The following examples show how to use matchObject and matchArray. For more details, look at the test.js
file included with searchjs.

````JavaScript
var list = [{name:"John",age:25},{name:"Jill",age:30}];
matches = s.matchObject(list[0],{name:"Johnny"}); // returns false
matches = s.matchArray(list,{name:"John"}); // returns [{name:"John",age:25}]
matches = s.matchField(list[0].name,"John"); // returns true
````

#### matchField
`matchField(value,comparator,text,word)` is the underlying matcher for matching an individual object. It always returns `true` or `false`, depending on whether the item matched. It infers the type of `value`, and then tests it against the comparator.

The argument structure is as follows:

* `value`: a single value that is to be matched. It can be any item type, including string, number, boolean, array, object, null, undefined.
* `comparator`: the rule for comparison. See below.
* `text`: boolean. For strings only, determine whether to allow for `comparator` to exist anywhere in `value`, or if it must be an exact match. See below.
* `word`: boolean. For strings only, determine whether `comparator` should exist as a single word in `value`, or if it must be an exact match. 

##### String matching
If `value` is a string, then `comparator`, which also should be a string, can be matched in one of 3 ways:

1. Exact match: Do not set `text` or `word`. This is the default.
2. Anywhere: `comparator` can exist anywhere in `value`. Set `text = true`.
3. Exact word: `comparator` must be a word somewhere in `value`. Set `word = true`.

Note that `text` overrides `word` if both are set to `true`.

Examples:

````javascript
matchFiled("This is a cool program","progr"); // false
matchFiled("This is a cool program","progr",false,false); // false
matchFiled("This is a cool program","progr",false); // false
matchFiled("This is a cool program","progr"); // false
matchFiled("This is a cool program","progr", true); // true
matchFiled("This is a cool program","program",false,true); // true
matchFiled("This is a cool program","This is a cool program"); // true
````

##### Comparator
The comparator can be one of the following, and match based on the following comparator rules

* `null`: match if `value === null`
* `undefined`: match if `value === undefined`
* `true`: match if `value === true` (no casting is done, precise match)
* `false`: match if `value === false` (no casting is done, precise match)
* `number`: match if `value === comparator` (no casting is done, precise match)
* `object` with range for numeric `value`: `{from: 12, to: 25}` or `{gt: 11, lt: 26}`. Match if `typeof(value) === "number"` and `value` is in the given range.
* `string`: match if one of the following conditions is true:
    * (`typeof(value) === "string"`) and (`value === comparator`)
    * (`typeof(value) === "string"`) and (`value` contains `comparator`) and (`text === true`)
    * (`typeof(value) === "string"`) and (`value` contains a word equal to `comparator`) and (`word === true`)
    * (`typeof(value) === "object"`) and (`value[comparator] !=== undefined`)
* Array: match each item in the array. Return `true` if a single item matches.



### Override Defaults
 
Most of the functionality in searchjs has a given set of defaults. If you wish to override those defaults globally, you can do so as follows:

````JavaScript
var s = require('searchjs');
s.setDefaults(defaults);
````

where `defaults` is an object with the property name and its new default. This can be convenient, for example, if you wish to set the same separator for all searches, and not set them independently for each one.

As of this writing, the following defaults can be overridden:

* `negator`: boolean. Whether or not a search term should match on `true` or `false`. Defaults to `false`. If set to `true`, then searching `{name: "Jill"}` will match all those whose names are *not* `"Jill"`, the equivalent of setting `{name: "Jill", _not: true}`.
* `join`: String, whether to join search terms by default with a logical AND or logical OR. Defaults to `"AND"`. If set to `"OR"`, then searching `{name: "Jill", age: 30}` will match those whose name is `"Jill"` *OR* who have the age of `30`, the equivalent of setting `{name: "Jill", age: 30, _join: "OR"}`.
* text: boolean. Whether string values in searches should match text, i.e. as part of the field. Defaults to `false`. If set to `true`, then searching `{name: "Jill"}` will match those whose names are `"Jill"`, `"Jillian"`, "EJilli", the equivalent of searching for `{name: "Jill", _text:true}`.
* word: boolean. Whether string values in searches should match word, i.e. as a complete word as part of the field. Defaults to `false`. If set to `true`, then searching `{name: "Jill"}` will match those whose names are `"Jill"`, `"Hi Jill Smith"`, the equivalent of searching for `{name: "Jill", _word:true}`.
* separator: The character to use as the separator for deep searching. Defaults to `'.'`. Changing it, for example, to `':'` and then searching for `{"city:Montreal": "Bagels"}` is the equivalent of `{"city:Montreal": "Bagels", _separator: ":"}`.
* propertySearch: Whether to use deep property matching by default. Defaults to `false`. If set to `true`, then will always do deep property searching. Searching for `{name: "Jill"}` will be the equivalent of `{name: "Jill", _propertySearch: true}`.
* propertySearchDepth: How deep to do deep property searches by default. Defaults to `-1`, i.e. infinite depth. 
  

At any point, you can reset defaults by doing:

````JavaScript
s.resetDefaults();
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

