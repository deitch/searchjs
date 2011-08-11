/*jslint node:true, nomen:false */
var assert = require('assert'), search = require("./lib/searchjs");
var runTest, data, searches;

data = [
	{name:"Alice",age:25},
	{name:"Brian",age:30},
	{name:"Carrie",age:30},
	{name:"David",age:35},
	{name:"Alice",age:30}
];
searches = [
	{search: {name:"alice"}, results:[0,4]},
	{search: {name:"brian"}, results:[1]},
	{search: {name:"alice",_not: true}, results:[1,2,3]},
	{search: {age:25}, results:[0]},
	{search: {age:30}, results:[1,2,4]},
	{search: {age:35, name: "Alice", _join: "OR"},results: [0,3,4]},
	{search: {age:35, name: "Alice", _not: true},results: [1,2]},
	{search: {terms: [{age:30,name:"Brian",_join:"AND"},{age:25}], _join:"OR"}, results:[0,1]}
];


// run each test
runTest = function() {
	var i, j, m, hash, arrayResults;
	for (i=0;i<searches.length;i++) {
		// turn the results array into a hash
		hash = {};
		arrayResults = [];
		for (j=0; j<data.length;j++) {
			hash[j] = false;
		}
		for (j=0; j<searches[i].results.length; j++) {
			hash[searches[i].results[j]] = true;
			arrayResults.push(data[searches[i].results[j]]);
		}
		// first do the object search matches
		for (j=0; j<data.length;j++) {
			m = search.matchObject(data[j],searches[i].search);
			// it should be a match or not
			assert.equal(m,hash[j],"Should match for data "+j+" as "+hash[j] + " on search "+i);
		}
		// next do the array matches
		m = search.matchArray(data,searches[i].search);
		// check the results - we need to find a way to match the entries of two arrays of objects
		//  easiest is probably to just json-ify them and compare the strings
		assert.equal(JSON.stringify(arrayResults)+" ",JSON.stringify(m),"Should match arrays for search "+i);
	}
};

runTest();
