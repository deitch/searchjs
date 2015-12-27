/* jslint node: true */
/*
 * Performance test courtesy of @janober http://github.com/janober
 */
var search = require("../lib/searchjs");

var numListItems = 1000;
var numSearches = 100;
var numIterations = 20;

var list = [];

console.log('Data set size: '+numListItems);
console.log('Iterations: '+numIterations);
console.log('Searches per iteration: '+numSearches);
console.log('Start test');

for (var i=0;i<numListItems;i++) {
  list.push(
    {
      title: "Car "+i,
      data: {
        passengers: [
          {
            name: 'Jane '+i
          },
          {
            name: 'Frank '+i
          }
        ],
        engine: {
          hp: i
        }
      }
    }
  );
}

var timeTook = [];
for (var j=0;j<numIterations;j++) {
  var start = new Date().getTime();
  for (var i=0;i<numSearches;i++) {
    search.matchArray(list, {"title": "Car 1"});
    //search.matchArray(list, {"data.engine.hp": 1});
    //search.matchArray(list, {"data.passengers.name": "Jane 1"});
  }
  var end = new Date().getTime();
  timeTook.push(end - start);
}

var overallTime = timeTook.reduce(function(a, b){return a+b;});

console.log('Shortest time: '+Math.min.apply(null, timeTook)+" ms");
console.log('Longest time: '+Math.max.apply(null, timeTook)+" ms");
console.log('Average execution time: '+(overallTime/numIterations)+" ms");
