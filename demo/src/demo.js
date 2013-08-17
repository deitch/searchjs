
$(function() {

  var data, searches, table;

  data = [
    { name : 'Alice',  age : 25 },
    { name : 'Brian',  age : 30 },
    { name : 'Carrie', age : 30 },
    { name : 'David',  age : 35 },
    { name : 'Alice',  age : 30 }
  ];

  searches = [
    { name : 'alice' },
    { name : 'brian' },
    { name : 'alice', _not : true },
    { age : 25 },
    { age : 30 },
    { age : 35, name : 'Alice', _join : 'OR' },
    { age : 35, name : 'Alice', _not : true },
    { terms: [{ age : 30, name : 'Brian', _join : 'AND' }, { age : 25 }], _join : 'OR' }
  ];
  
  // show the data
  $('div#data').text(JSON.stringify(data));
  
  // show the search options
  table = $('div#search table tbody');
  // build table
  $.each(searches,function(i, s) {

    var tds, row;
    row = $('<tr></tr>');
    tds = $('<td></td>')
      .addClass('row')
      .addClass('clickable')
      .text(JSON.stringify(s))
      .appendTo(row);
    row.appendTo(table);

    // on click, search
    tds.on('click', function() {
      var results = SEARCHJS.matchArray(data, s);
      $('div#results').text(JSON.stringify(results));
    });
  
  });

});
