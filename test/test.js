/*jslint node:true, nomen:true */
/*global it, describe, before, after */
import {matchObject, matchArray, setDefaults, resetDefaults} from "../src/searchjs";
const should = require('should');
let data, searches;

data = [
	{name:"Alice",fullname:"I am Alice Shiller",age:25,birthday: new Date(1992, 1, 28),email: "alice@searchjs.com",city:{"Montreal":"first","Toronto":"second"}, other: { personal: { birthPlace: "Vancouver" }, emptyArray2: [] }, emptyArray1: [] },
	{name:"Brian",age:30,birthday: new Date(1987, 10, 16),email: "brian@searchjs.com",male:true,empty:"hello"},
	{name:"Carrie",age:30,birthday: new Date(1987, 5, 9), email: "carrie@searchjs.com",city:{"Montreal":true,"New York":false}},
	{name:"David",age:35,birthday: new Date(1982, 9, 17), email: "david@searchjs.com",male:true, personal: {cars: [{brand: 'Porsche', build: 2016}, {brand: 'BMW', build: 2014}]}},
	{name:"Alice",age:30,birthday: new Date(1987, 6, 10), email: ["alice@searchjs.com","alice@gmail.com"], cars: [{brand: 'BMW', build: 2015, cds: [{title:'Best Of 2015'}, {title:'Best Of 2016'}]}, {brand: 'Porsche', build: 2013}]},
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
	// Number
	{search: {age:{from:30}},results:[1,2,3,4]},
	{search: {age:{gte:30}},results:[1,2,3,4]},
	{search: {age:{from:30,to:34}},results:[1,2,4]},
	{search: {age:{gte:30,lte:34}},results:[1,2,4]},
	{search: {age:{from:25,to:30}},results:[0,1,2,4]},
	{search: {age:{gte:25,lte:30}},results:[0,1,2,4]},
	{search: {age:{to:29}},results:[0]},
	{search: {age:{lte:29}},results:[0]},
	{search: {age:{gt:30}},results:[3]},
	{search: {age:{lt:30}},results:[0]},
	{search: {age:{gt:25,lt:35}},results:[1,2,4]},
	{search: {_not:true,age:{to:29}},results:[1,2,3,4,5,6]},
	{search: {_not:true,age:{from:30,to:34}},results:[0,3,5,6]},
	// Date
	{search: {birthday: new Date(1992, 1, 28)}, results:[0]},
	{search: {birthday:{from: new Date(1985, 9, 17)}},results:[0,1,2,4]},
	{search: {birthday:{gte:new Date(1982, 9, 17)}},results:[0,1,2,3,4]},
	{search: {birthday:{from:new Date(1981, 9, 17),to:new Date(1995, 1, 28)}},results:[0,1,2,3,4]},
	{search: {birthday:{gte:new Date(1982, 9, 17),lte:new Date(1992, 1, 28)}},results:[0,1,2,3,4]},
	{search: {birthday:{to:new Date(1987, 5, 7)}},results:[3]},
	{search: {birthday:{lte:new Date(1987, 5, 9)}},results:[2,3]},
	{search: {birthday:{gt:new Date(1987, 5, 9)}},results:[0,1,4]},
	{search: {birthday:{lt:new Date(1987, 5, 9)}},results:[3]},
	{search: {birthday:{gt:new Date(1982, 9, 17),lt:new Date(1992, 1, 28)}},results:[1,2,4]},
	{search: {_not:true,birthday:{to:new Date(1987, 5, 9)}},results:[0,1,4,5,6]},
	{search: {_not:true,birthday:{from:new Date(1987, 5, 9),to:new Date(1987, 10, 16)}},results:[0,3,5,6]},
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
	{search: {"level6":{gte:100,lte:300}, _propertySearch:true},results:[6]},
	{search: {"terms":[{"level6":{gte:100}, _propertySearch:true}, {"level1.level6":{lte:300}, _propertySearch:true}]},results:[6]},
	{search: {name:"bri",_start:true}, results:[1]},
	{search: {name:"n",_end:true}, results:[1,6]}
];


describe('searchjs', () => {
	describe('without defaults', () => {
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
			(function(hash,arrayResults,entry){
				describe('for entry '+JSON.stringify(entry.search), function(){
					describe('matchObject', function(){
						for (j=0; j<data.length;j++) {
							(function (d,h) {
								var isNot = (h?"":"NOT ");
								it('should '+isNot+"match for data "+JSON.stringify(d), function(){
									m = matchObject(d,entry.search);
									// it should be a match or not
									m.should.eql(h);
								});
							}(data[j],hash[j]));
						}
					});
					describe('matchArray', function(){
						it('should match only '+JSON.stringify(arrayResults), function(){
							// next do the array matches - match against the entire data set, and expect the results to match our results
							m = matchArray(data,entry.search);
							// check the results - we need to find a way to match the entries of two arrays of objects
							//  easiest is probably to just json-ify them and compare the strings
							m.should.eql(arrayResults);
						});
					});
				});
			}(hash,arrayResults,entry));
		}
	});

	// defaults has many more permutations, so we are structuring it manually
	describe('with defaults', () => {
		describe('negator', () => {
			let nonot, yesnot;
			before(function(){
				yesnot = matchArray(data,{name:"alice",_not:true});
				nonot = matchArray(data,{name:"alice",_not:false});
				setDefaults({negator:true});
			});
			after(function () {
				resetDefaults();
			});
			it('should match NOT without explicit _not', function(){
				matchArray(data,{name:"alice"}).should.eql(yesnot);
			});
			it('should match true with explicit override', function(){
				matchArray(data,{name:"alice",_not:false}).should.eql(nonot);
			});
		});
		describe('join', () => {
			var joinand, joinor;
			before(function(){
				joinand = matchArray(data,{age:25, name: "Alice"});
				joinor = matchArray(data,{age:25, name: "Alice",_join:"OR"});
				setDefaults({join:"OR"});
			});
			after(() => {
				resetDefaults();
			});
			it('should match OR without explicit OR', function(){
				matchArray(data,{name:"alice","age":25}).should.eql(joinor);
			});
			it('should match AND with explicit override', function(){
				matchArray(data,{name:"alice","age":25,_join:"AND"}).should.eql(joinand);
			});
		});
		describe('text', () => {
			let yestext, notext;
			before(function(){
				yestext = matchArray(data,{name:"alic",_text:true});
				notext = matchArray(data,{name:"alic"});
				setDefaults({text:true});
			});
			after(function () {
				resetDefaults();
			});
			it('should match text without explicit _text', function(){
				matchArray(data,{name:"alic"}).should.eql(yestext);
			});
			it('should match not text with explicit override', function(){
				matchArray(data,{name:"alic",_text:false}).should.eql(notext);
			});
		});
		describe('word', () => {
			let yesword, noword;
			before(function(){
				yesword = matchArray(data,{fullname:"alice",_word:true});
				noword = matchArray(data,{fullname:"alice"});
				setDefaults({word:true});
			});
			after(function () {
				resetDefaults();
			});
			it('should match text without explicit _text', function(){
				matchArray(data,{fullname:"alice"}).should.eql(yesword);
			});
			it('should match not text with explicit override', function(){
				matchArray(data,{fullname:"alice",_word:false}).should.eql(noword);
			});
		});
		describe('start', () => {
			let yesword, noword;
			before(function(){
				yesword = matchArray(data,{fullname:"car",_start:true});
				noword = matchArray(data,{fullname:"cari"});
				setDefaults({start:true});
			});
			after(function () {
				resetDefaults();
			});
			it('should match begin text without explicit _start', function(){
				matchArray(data,{fullname:"car"}).should.eql(yesword);
			});
			it('should match begin text with explicit _start true', function(){
				matchArray(data,{fullname:"car",_start:true}).should.eql(yesword);
			});
			it('should not match text with explicit _start false', function(){
				matchArray(data,{fullname:"alice",_start:false}).should.eql(noword);
			});
			it('should not match text _start true but not beginning of word', function(){
				matchArray(data,{fullname:"lice",_start:true}).should.eql(noword);
			});
		});
		describe('end', () => {
			let yesword, noword;
			before(function(){
				yesword = matchArray(data,{fullname:"rrie",_end:true});
				noword = matchArray(data,{fullname:"arie"});
				setDefaults({end:true});
			});
			after(function () {
				resetDefaults();
			});
			it('should match end text without explicit _end', function(){
				matchArray(data,{fullname:"rrie"}).should.eql(yesword);
			});
			it('should match end text with explicit _end true', function(){
				matchArray(data,{fullname:"rrie", _end:true}).should.eql(yesword);
			});
			it('should not match text with explicit _end false', function(){
				matchArray(data,{fullname:"rrie",_end:false}).should.eql(noword);
			});
			it('should not match text _end true but not end of word', function(){
				matchArray(data,{fullname:"rri",_end:true}).should.eql(noword);
			});
		});
		describe('separator', () => {
			let matches;
			before(function(){
				matches = matchArray(data,{"city.Montreal":"first"});
				setDefaults({separator:":"});
			});
			after(function () {
				resetDefaults();
			});
			it('should match field without explicit separator', function(){
				matchArray(data,{"city:Montreal":"first"}).should.eql(matches);
			});
			it('should match field with explicit separator override', function(){
				matchArray(data,{"city.Montreal":"first",_separator:"."}).should.eql(matches);
			});
		});
		describe('propertySearch', () => {
			let yesdeep, nodeep;
			before(function(){
				yesdeep = matchArray(data,{"Montreal":"first",_propertySearch:true});
				nodeep = matchArray(data,{"Montreal":"first"});
				setDefaults({propertySearch:true});
			});
			after(function () {
				resetDefaults();
			});
			it('should match field without explicit _propertySearch', function(){
				matchArray(data,{"Montreal":"first"}).should.eql(yesdeep);
			});
			it('should not match field with explicit _propertySearch override', function(){
				matchArray(data,{"Montreal":"first",_propertySearch:false}).should.eql(nodeep);
			});
		});
		describe('propertySearchDepth', () => {
			let yesdepth, nodepth;
			before(function(){
				yesdepth = matchArray(data,{"brand":"bmw",_propertySearch:true,_propertySearchDepth: 2});
				nodepth = matchArray(data,{"brand":"bmw",_propertySearch:true});
				setDefaults({propertySearchDepth:2});
			});
			after(function () {
				resetDefaults();
			});
			it('should match correct fields without explicit _propertySearchDepth', function(){
				matchArray(data,{"brand":"bmw",_propertySearch:true}).should.eql(yesdepth);
			});
			it('should not match field with explicit _propertySearch override', function(){
				matchArray(data,{"brand":"bmw",_propertySearch:true,_propertySearchDepth:-1}).should.eql(nodepth);
			});
		});
	});
});
