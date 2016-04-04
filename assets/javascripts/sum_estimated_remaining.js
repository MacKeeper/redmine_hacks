function getRMHData() {
  if ( window.rmhdata == undefined ) {
    window.rmhdata = {}
  }
  return window.rmhdata;
}

/*
 * Updator will be called with group everytime an issue change and on page load
 * @param updator function( group )
 */
function addGroupUpdator( updator ) {
  var data = getRMHData();
  if ( data.groupUpdators == undefined ) {
    data.groupUpdators = [];
  }
  data.groupUpdators.push( updator );
}

function isColumnDisplayed( columnName ) {
  return $( ".list.issues thead tr th:contains('" + columnName + "')" ).index() != -1;
}

function addGroupSum( columnName, label ) {
  addGroupUpdator( function ( group ) {
    if ( !isColumnDisplayed( columnName ) ) {
      return;
    }
    var columnIndex = $( ".list.issues thead tr th:contains('" + columnName + "')" ).index();
    var sum = getSum( group, columnName );
    setGroupInfo( group, 'count-' + columnIndex, (label != undefined ? label : columnName) + ": " + sum )
  } )
}

function updateGroups() {
  $( ".group" ).each( function ( i, group ) {
    var data = getRMHData();
    for ( var x = 0; x < data.groupUpdators.length; x++ ) {
      data.groupUpdators[x]( $( group ) );
    }
  } )
}

function setGroupInfo( group, infoClass, info ) {
  var countSpan = group.find( "." + infoClass );
  if ( countSpan.length == 0 ) {
    countSpan = $( '<span />' ).addClass( infoClass ).addClass( 'count' );
    group.find( 'td :last-child' ).before( countSpan );
  }
  countSpan.text( info );
}

function getColumnIndex( columnName ) {
  var columnIndex = $( ".list.issues thead tr th:contains('" + columnName + "')" ).index();
  if ( columnIndex == -1 ) {
    return undefined;
  }
  // Offset by one for issues
  return columnIndex + 1;
}

function getCellValueFloat( cell ) {
  var value = $( cell ).text();
  if ( value !== undefined && value !== "" ) {
    return parseFloat( value );
  } else {
    return undefined;
  }
}

function getSum( group, columnName ) {
  var columnIndex = getColumnIndex( columnName );

  var sum = 0;
  var issues = group.nextUntil( ".group" ).filter( ":not(.dragged-element)" );
  issues.find( ":nth-child(" + columnIndex + ")" ).each( function ( i, cell ) {
    var estimate = getCellValueFloat( cell );
    if ( estimate !== undefined ) {
      sum += estimate;
    }
  } );
  return sum;
}

function getTimeRemaining( group ) {
  var estimatedTimeColumnIndex = getColumnIndex( "Estimated time" );
  var percentDoneColumnIndex = getColumnIndex( "% Done" );
  if ( percentDoneColumnIndex == undefined ) {
    return undefined;
  }

  var totalRemaining = 0;

  var issues = group.nextUntil( ".group" ).filter( ":not(.dragged-element)" );
  issues.each( function ( i, issue ) {
    var issue = $( issue );
    var estimate = getCellValueFloat( issue.find( ":nth-child(" + estimatedTimeColumnIndex + ")" ) );
    if ( estimate == undefined ) {
      return;
    }

    var closedPercent = 0;
    var closedPercentCell = issue.find( ":nth-child(" + percentDoneColumnIndex + ") .closed" );
    if ( closedPercentCell.length != 0 ) {
      widthPercent = closedPercentCell[0].style.width;
      if ( widthPercent !== undefined && widthPercent !== "" ) {
        closedPercent = parseFloat( widthPercent.substr( 0, widthPercent.length - 1 ) ) / 100;
      }
    }

    totalRemaining += estimate * (1 - closedPercent);
  } );

  return totalRemaining;
}

$( function () {

  addGroupSum( "Estimated time", "Estimated" );

  addGroupUpdator( function ( group ) {
    if ( !isColumnDisplayed( '% Done' ) || !isColumnDisplayed( 'Estimated time' ) ) {
      return;
    }
    setGroupInfo( group, 'percent-remaining', "Remaining: " + getTimeRemaining( group ) );
  } );

  updateGroups();
} );