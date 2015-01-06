// ==UserScript==
// @name         Redmine Drag 'n drop
// @namespace    www.8d.com
// @version      0.7
// @description  Drag 'n Drop awesomeness
// @include      https://*redmine*issues/*
// @include      https://*redmine*/*/issues*
// @author       mdarveau
// @grant    GM_addStyle
// @grant    GM_getResourceText
// @require https:/cdn.madebyglutard.com/libs/chosen/1.2.0/chosen.jquery.js
// @resource chosen_CSS https://cdn.madebyglutard.com/libs/chosen/1.2.0/chosen.css
// @run-at document-end
// @updateURL https://raw.githubusercontent.com/MacKeeper/redmine_hacks/master/hacks.js
// @downloadURL https://raw.githubusercontent.com/MacKeeper/redmine_hacks/master/hacks.js
// ==/UserScript==

var chosen_CSS = GM_getResourceText ("chosen_CSS");
GM_addStyle (chosen_CSS);

GM_addStyle (".chosen-container-single .chosen-single abbr {  background: url('https//cdn.madebyglutard.com/libs/chosen/1.2.0/chosen-sprite.png') -42px 1px no-repeat;}");
GM_addStyle (".chosen-container-single .chosen-single div b {  background: url('https//cdn.madebyglutard.com/libs/chosen/1.2.0/chosen-sprite.png') no-repeat 0px 2px;}");
GM_addStyle (".chosen-container-single .chosen-search input[type='text'] {  background: white url('https//cdn.madebyglutard.com/libs/chosen/1.2.0/chosen-sprite.png') no-repeat 100% -20px;  background: url('https//cdn.madebyglutard.com/libs/chosen/1.2.0/chosen-sprite.png') no-repeat 100% -20px;}");
GM_addStyle (".chosen-container-multi .chosen-choices li.search-choice .search-choice-close {  background: url('https//cdn.madebyglutard.com/libs/chosen/1.2.0/chosen-sprite.png') -42px 1px no-repeat;}");
GM_addStyle (".chosen-rtl .chosen-search input[type='text'] {  background: white url('https//cdn.madebyglutard.com/libs/chosen/1.2.0/chosen-sprite.png') no-repeat -30px -20px;  background: url('https//cdn.madebyglutard.com/libs/chosen/1.2.0/chosen-sprite.png') no-repeat -30px -20px;}");
GM_addStyle ("@media only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min-resolution: 144dpi) {.chosen-rtl .chosen-search input[type='text'],.chosen-container-single .chosen-single abbr,.chosen-container-single .chosen-single div b,.chosen-container-single .chosen-search input[type='text'],.chosen-container-multi .chosen-choices .search-choice .search-choice-close,.chosen-container .chosen-results-scroll-down span,.chosen-container .chosen-results-scroll-up span{background-image:url('https://cdn.madebyglutard.com/libs/chosen/1.2.0/chosen-sprite@2x.png')!important;background-size:52px 37px!important;background-repeat:no-repeat!important;}}");

GM_addStyle (".chosen-container, .chosen-single span {color: black;}");
GM_addStyle (".chosen-container .chosen-results { max-height: 800px; }");
/**
* Utilities
*/

// http://stackoverflow.com/questions/1720320/how-to-dynamically-create-css-class-in-javascript-and-apply
function createCSSSelector( selector, style ) {
   if ( !document.styleSheets ) {
       return;
   }

   if ( document.getElementsByTagName( "head" ).length == 0 ) {
       return;
   }

   var stylesheet;
   var mediaType;
   if ( document.styleSheets.length > 0 ) {
       for ( i = 0; i < document.styleSheets.length; i++ ) {
           if ( document.styleSheets[i].disabled ) {
               continue;
           }
           var media = document.styleSheets[i].media;
           mediaType = typeof media;

           if ( mediaType == "string" ) {
               if ( media == "" || (media.indexOf( "screen" ) != -1) ) {
                   styleSheet = document.styleSheets[i];
               }
           } else if ( mediaType == "object" ) {
               if ( media.mediaText == "" || (media.mediaText.indexOf( "screen" ) != -1) ) {
                   styleSheet = document.styleSheets[i];
               }
           }

           if ( typeof styleSheet != "undefined" ) {
               break;
           }
       }
   }

   if ( typeof styleSheet == "undefined" ) {
       var styleSheetElement = document.createElement( "style" );
       styleSheetElement.type = "text/css";

       document.getElementsByTagName( "head" )[0].appendChild( styleSheetElement );

       for ( i = 0; i < document.styleSheets.length; i++ ) {
           if ( document.styleSheets[i].disabled ) {
               continue;
           }
           styleSheet = document.styleSheets[i];
       }

       var media = styleSheet.media;
       mediaType = typeof media;
   }

   if ( mediaType == "string" ) {
       for ( i = 0; i < styleSheet.rules.length; i++ ) {
           if ( styleSheet.rules[i].selectorText && styleSheet.rules[i].selectorText.toLowerCase() == selector.toLowerCase() ) {
               styleSheet.rules[i].style.cssText = style;
               return;
           }
       }

       styleSheet.addRule( selector, style );
   } else if ( mediaType == "object" ) {
       for ( i = 0; i < styleSheet.cssRules.length; i++ ) {
           if ( styleSheet.cssRules[i].selectorText && styleSheet.cssRules[i].selectorText.toLowerCase() == selector.toLowerCase() ) {
               styleSheet.cssRules[i].style.cssText = style;
               return;
           }
       }

       styleSheet.insertRule( selector + "{" + style + "}", styleSheet.cssRules.length );
   }
}

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
        setGroupInfo( group, 'count-' + columnIndex, (label != undefined? label : columnName) + ": " + sum )
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

function getColumnIndex( columnName ){
    var columnIndex = $( ".list.issues thead tr th:contains('" + columnName + "')" ).index();
    if ( columnIndex == -1 ) {
        return undefined;
    }
    // Offset by one for issues
    return columnIndex + 1;
}

function getCellValueFloat( cell ){
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

function getTimeRemaining( group ){
    var estimatedTimeColumnIndex = getColumnIndex( "Estimated time" );
    var percentDoneColumnIndex = getColumnIndex( "% Done" );
    if( percentDoneColumnIndex == undefined ){
        return undefined;
    }
    
    var totalRemaining = 0;
    
    var issues = group.nextUntil( ".group" ).filter( ":not(.dragged-element)" );
    issues.each( function ( i, issue ) {
        var issue = $(issue);
        var estimate = getCellValueFloat( issue.find( ":nth-child(" + estimatedTimeColumnIndex + ")" ) );
        if( estimate == undefined ){
            return;
        }
        
        var closedPercent = 0;
        var closedPercentCell = issue.find( ":nth-child(" + percentDoneColumnIndex + ") .closed" );
        if( closedPercentCell.length != 0 ){
            widthPercent = closedPercentCell[0].style.width;
            console.log( "Width percent:" + widthPercent );
            if ( widthPercent !== undefined && widthPercent !== "" ) {
                closedPercent = parseFloat( widthPercent.substr( 0, widthPercent.length - 1 ) ) / 100;
            }
        }
        
        totalRemaining += estimate * (1-closedPercent);
    } );
    
    return totalRemaining;
}

function getLastRowOfGroup( group ) {
    var nextGroupTr = $( group ).nextAll( ".group" ).first();
    if ( nextGroupTr.length != 0 ) {
        return nextGroupTr.prev();
    } else {
        var nextIssues = group.nextAll( ".issue" );
        if ( nextIssues.length != 0 ) {
            return nextIssues.last();
        } else {
            return group;
        }
    }
}

function enableDragAndDrop() {
    // Create a class for drop active
    createCSSSelector( ".dropZoneActive", "background-color:#ffffdd;" );
    createCSSSelector( ".dropZoneHover", "background-color: #ffffdd;border-color: #FF0000;border-style: solid; border-width: 1px;" );

    // Style for not confirmed issue
    createCSSSelector( ".issue-post-in-progress", "opacity: 0.3;" );

    $( ".issue:not(.details)" ).each( function ( i, issue ) {
        issue = $( issue );

        var draggableDiv = issue.draggable( {
            scroll: true,
            axis: "y",
            revert: "invalid",
            opacity: 0.7,
            helper: function ( event ) {
                var draggedElement = $( event.currentTarget ).clone();
                draggedElement.removeClass( "context-menu-selection" );
                draggedElement.addClass( "dragged-element" );
                return draggedElement;
            },
            start: function ( event, ui ) {
                var dragStartItem = ui.helper.find( "td[class='id'] a" ).text();
                
                // Only drag other selected issues if the currently dragged was selected
                if ( $( event.currentTarget ).hasClass( 'context-menu-selection' ) ) {
                    var selectedItems = $( ".context-menu-selection" ).map( function ( i, selectedIssue ) {
                        return $( selectedIssue ).find( "td[class='id'] a" ).text();
                    } ).get();

                    //if ( $.inArray( dragStartItem, selectedItems ) == -1 ) {
                    //    selectedItems.push( dragStartItem );
                    //}
                } else {
                    selectedItems = [];
                    selectedItems.push( dragStartItem );
                }

                console.log( "Dragged issues: " + selectedItems );
                window.selectedIDs = selectedItems;
            },
            drag: function () {
            },
            stop: function () {
            }
        } );

        //$( '.subject', draggableDiv ).mousedown( function ( ev ) {
        //    draggableDiv.draggable( 'disable' );
        //} ).mouseup( function ( ev ) {
        //    draggableDiv.draggable( 'enable' );
        //} );

   } )

   $( ".group" ).each( function ( i, group ) {
       group = $( group );
       group.droppable( {
           accept: ".issue",
           activeClass: "dropZoneActive",
           hoverClass: "dropZoneHover",
           drop: function ( event, ui ) {
               var groupRow = $( this );
               var draggedIssueNumbers = window.selectedIDs;

               // TODO Check content of availableFilters to map values to ids
               selectedGroupValue = $( "#group_by :selected" ).val();
               if ( selectedGroupValue.indexOf( "cf_" ) === 0 ) {
                   // Custom field
                   groupField = 'issue[custom_field_values][' + selectedGroupValue.substr( "cf_".length ) + ']';
                   groupValue = groupRow.find( "td" ).clone().children().remove().end().text().trim();
               } else {
                   // Standard fields
                   groupField = 'issue[' + selectedGroupValue + '_id]';
                   if ( selectedGroupValue == "assigned_to" ) {
                       groupValue = groupRow.find( "a" ).attr( 'href' ).substr( "/users/".length );
                   } else {
                       alert( "Unsupported group by for d&d: " + groupField )
                   }
               }

               console.log( "Assign " + draggedIssueNumbers + " to " + groupValue );

               // Move row right away but apply a "temporaty" style
               for ( var x = 0; x < draggedIssueNumbers.length; x++ ) {
                   var row = $( "tr:has(td[class='id'] a:contains(" + draggedIssueNumbers[x] + "))" );
                   row.addClass( "issue-post-in-progress" );
                   row.detach();
                   getLastRowOfGroup( groupRow ).after( row );
               }

               // Trigger a sum refresh
               updateGroups();

               updateIssue( draggedIssueNumbers, groupField, groupValue, function ( ids ) {
                   for ( var x = 0; x < draggedIssueNumbers.length; x++ ) {
                       var row = $( "tr:has(td[class='id'] a:contains(" + draggedIssueNumbers[x] + "))" );
                       row.removeClass( "issue-post-in-progress" );
                   }
               } );
           }
       } );
   } )
}

function encodeIds( issues ) {
   return $( issues ).map( function ( i, issue ) {
       return encodeURIComponent( 'ids[]' ) + "=" + encodeURIComponent( issue )
   } ).get().join( '&' );
}

function updateIssue( issues, field, value, callback ) {
    var queryString = "back_url=" + encodeURIComponent( "/" ) + "&" + encodeIds( issues ) + "&" + encodeURIComponent( field ) + "=" + encodeURIComponent( value );
    $.post( '/issues/bulk_update?' + queryString, {authenticity_token: $( "input[name='authenticity_token']" ).val()}, function ( data, status, jqXHR ) {
        if ( status == "success" ) {
           callback()
       } else {
            alert( "Update failed: " + data );
            window.location = window.location;
        }
    } )
}

function setupKeyShortcut() {
    $(document).keypress( function( event ){
            if( !event.altKey && ($(event.target).is("input") || $(event.target).is("textarea")) ){
                return;
            }
            switch( event.charCode ) {
                case 101:
                    showAndScrollTo("update", "issue_notes");
                    return false;
                
                case 13:
                    $("#issue-form" ).submit();
                    return false;
                
                default:
                    console.log(event.charCode)
            }
        }
    )
}

$( function () {
    console.log( "New" );
    
    addGroupSum( "Estimated time", "Estimated" );

    addGroupUpdator( function ( group ) {
        if ( !isColumnDisplayed( '% Done' ) || !isColumnDisplayed( 'Estimated time' ) ) {
            return;
        }
        setGroupInfo( group, 'percent-remaining', "Remaining: " + getTimeRemaining( group ) );
        
    } )

    updateGroups();
    enableDragAndDrop();
    setupKeyShortcut();

    $( "#quick-search select" ).chosen( {no_results_text: "Not found"} );
} );
