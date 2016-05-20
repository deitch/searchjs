/*jslint node:true, nomen:true */
var assert = require('assert'), search = require("../lib/searchjs");
var runTest, data, searches;

data = [
	{name:"Alice",age:25, email: "alice@searchjs.com",city:{"Montreal":"first","Toronto":"second"}, other: { personal: { birthPlace: "Vancouver" }, emptyArray2: [] }, emptyArray1: [] },
	{name:"Brian",age:30, email: "brian@searchjs.com",male:true,empty:"hello"},
	{name:"Carrie",age:30, email: "carrie@searchjs.com",city:{"Montreal":true,"New York":false}},
	{name:"David",age:35, email: "david@searchjs.com",male:true, personal: {cars: [{brand: 'Porsche', build: 2016}, {brand: 'BMW', build: 2014}]}},
	{name:"Alice",age:30, email: ["alice@searchjs.com","alice@gmail.com"], cars: [{brand: 'BMW', build: 2015, cds: [{title:'Best Of 2015'}, {title:'Best Of 2016'}]}, {brand: 'Porsche', build: 2013}]},
	{name:"Other",id: 3,currentC: {cer: {id: 2}}},
	{name:"John", "level1":{"level2":{"level3":{"level4":{"level5":{"level6": 200}}}}}}
];
searches = [
	{search: {name:"alice"}, results:[0,4]},
	{search: {name:undefined}, results:[]},
	{search: {empty:undefined}, results:[0,2,3,4,5,6]} ,
	{search: {name:"alic"}, results:[]},
	{search: {name:"alic",_text:true}, results:[0,4]},
	{search: {name:"alic",_word:true}, results:[]},
	{search: {name:"alice",_word:true}, results:[0,4]},
	{search: {name:"brian"}, results:[1]},
	{search: {name:"alice",_not: true}, results:[1,2,3,5,6]},
	{search: {male:true}, results:[1,3]},
	{search: {age:30,male:true}, results:[1]},
	{search: {male:true,_not:true}, results:[0,2,4,5,6]},
	{search: {age:25}, results:[0]},
	{search: {age:30}, results:[1,2,4]},
	{search: {age:25, name: "Alice",email2:"foo@foo.com"},results: []},
	{search: {age:35, name: "Alice", _join: "OR"},results: [0,3,4]},
	{search: {age:35, name: "Alice", _not: true},results: [1,2,5,6]},
	{search: {terms: [{age:30,name:"Brian",_join:"AND"},{age:25}], _join:"OR"}, results:[0,1]},
	{search: {email: "alice@searchjs.com"},results: [0,4]},
	{search: {name: ["Brian","Carrie"]},results: [1,2]},
	{search: {email: ["alice@searchjs.com","carrie@searchjs.com"]},results: [0,2,4]},
	{search: {_not: true, name: ["Brian","Carrie"]},results: [0,3,4,5,6]},
	{search: {_not:true, email: ["alice@searchjs.com","carrie@searchjs.com"]},results: [1,3,5,6]},
	{search: {city:"Montreal"},results:[0,2]},
	{search: {_not:true,city:"Montreal"},results:[1,3,4,5,6]},
	{search: {age:{from:30}},results:[1,2,3,4]},
	{search: {age:{gt:30}},results:[1,2,3,4]},
	{search: {age:{from:30,to:34}},results:[1,2,4]},
	{search: {age:{gt:30,lt:34}},results:[1,2,4]},
	{search: {age:{from:25,to:30}},results:[0,1,2,4]},
	{search: {age:{gt:25,lt:30}},results:[0,1,2,4]},
	{search: {age:{to:29}},results:[0]},
	{search: {age:{lt:29}},results:[0]},
	{search: {_not:true,age:{to:29}},results:[1,2,3,4,5,6]},
	{search: {_not:true,age:{from:30,to:34}},results:[0,3,5,6]},
	{search: {"city.Montreal":"first"},results:[0]},
	{search: {"city.Montreal":["first","abc"]},results:[0]},
	{search: {"city:Montreal":"first",_separator: ':'},results:[0]},
	{search: {"city:Montreal":["first","abc"],_separator: ':'},results:[0]},
	{search: {"city.Montreal":true},results:[2]},
	{search: {"city.Montreal":"abc"},results:[]},
	{search: {"city.Montreal":["abc"]},results:[]},
	{search: {"city.foo":"abc"},results:[]},
	{search: {"other.personal.birthPlace":"vancouver"},results:[0]},
	{search: {"other:personal:birthPlace":"vancouver",_separator: ':'},results:[0]},
	{search: {"cars.brand":"bmw"},results:[4]},
	{search: {"cars.cds.title":"Best Of 2014"},results:[]},
	{search: {"cars.cds.title":"Best Of 2015"},results:[4]},
	{search: {"cars:cds:title":"Best Of 2015",_separator: ':'},results:[4]},
	{search: {"cars.cds.title":"Best Of 2016"},results:[4]},
	{search: {"currentC.cer.id": [1, 2]},results: [5]},
	{search: {"currentC.cer.id": [2, 1]},results: [5]},
	{search: {"Montreal":"first", _propertySearch:true}, results:[0]},
	{search: {"Montreal":"second", _propertySearch:true}, results:[]},
	{search: {"personal.cars.brand":"bmw", _propertySearch:true}, results:[3]},
	{search: {"brand":"bmw", _propertySearch:true}, results:[3,4]},
	{search: {"title":"Best Of 2015", _propertySearch:true}, results:[4]},
	{search: {build:{from:2016}},results:[]},
	{search: {build:{from:2016}, _propertySearch:true},results:[3]},
	{search: {"brand":"bmw", _propertySearch:true, _propertySearchDepth: 2}, results:[4]},
	{search: {"brand":"bmw", _propertySearch:true, _propertySearchDepth: 3}, results:[3,4]},
	{search: {"brand":"bmw", _propertySearch:true, _propertySearchDepth: -1}, results:[3,4]},
	{search: {"personal.brand":"bmw", _propertySearch:true, _propertySearchDepth: 3},results:[3]},
	{search: {"level1.level6":200}, results:[]},
	{search: {"level6":200}, results:[]},
	{search: {"level1.level6":200, _propertySearch:true}, results:[6]},
	{search: {"level2.level4.level6":200, _propertySearch:true}, results:[6]},
	{search: {"level4.level6":200, _propertySearch:true}, results:[6]},
	{search: {"level1.level2.level6":200, _propertySearch:true}, results:[6]},
	{search: {"level4.level6":200, _propertySearch:true, _propertySearchDepth: 5}, results:[]},
	{search: {"level4.level6":200, _propertySearch:true, _propertySearchDepth: 6}, results:[6]},
	{search: {"level3.level4.level6":200, _propertySearch:true, _propertySearchDepth: 6}, results:[6]},
	{search: {"level6":{gt:100,lt:300}, _propertySearch:true},results:[6]},
	{search: {"terms":[{"level6":{gt:100}, _propertySearch:true}, {"level1.level6":{lt:300}, _propertySearch:true}]},results:[6]},
];


// run each test
runTest = function() {
	var i, j, m, hash, arrayResults, entry;
	// we will go through each search
	for (i=0;i<searches.length;i++) {
		// turn the results array into a hash
		hash = {};
		arrayResults = [];
		entry = searches[i];
		// first indicate that none of the data should be a match unless we say it is
		for (j=0; j<data.length;j++) {
			hash[j] = false;
		}
		// identify those that we expect to be a match: mark the hash as true, and save the actual data entry to arrayResults
		for (j=0; j<entry.results.length; j++) {
			hash[entry.results[j]] = true;
			arrayResults.push(data[entry.results[j]]);
		}
		// first do the object search matches - search across all the objects, and expect the results to match only the ones we indicated in the hash
		for (j=0; j<data.length;j++) {
			m = search.matchObject(data[j],entry.search);
			// it should be a match or not
			assert.equal(m,hash[j],JSON.stringify(entry.search)+" should "+(hash[j]?"":"NOT ")+"match for data "+JSON.stringify(data[j]));
		}
		// next do the array matches - match against the entire data set, and expect the results to match our results
		m = search.matchArray(data,searches[i].search);
		// check the results - we need to find a way to match the entries of two arrays of objects
		//  easiest is probably to just json-ify them and compare the strings
		assert.equal(JSON.stringify(arrayResults),JSON.stringify(m),JSON.stringify(entry.search)+" expected results "+JSON.stringify(arrayResults)+" instead of "+JSON.stringify(m));
	}
};

runTest();
