// ==UserScript==
// @name         Redmine Drag 'n drop
// @namespace    www.8d.com
// @version      0.1
// @description  Drag 'n Drop awesomeness
// @author       mdarveau
// @include      https://redmine.priv.8d.com/*/issues*
// @grant        none
// @updateURL https://raw.githubusercontent.com/MacKeeper/redmine_hacks/master/hacks.js
// @downloadURL https://raw.githubusercontent.com/MacKeeper/redmine_hacks/master/hacks.js
// ==/UserScript==

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



function sumByEstimatedTime() {
   // FIXME Only apply if column is present
   // TODO Show in header instead of overriding issue count
   $( ".group" ).each( function ( i, group ) {
       var tasks = $( group ).nextUntil( ".group" );
       var sum = 0;
       tasks.each( function ( i, task ) {
           var estimate = $( $( task ).find( ".estimated_hours" ) ).text();
           if ( estimate !== undefined && estimate !== "" ) {
               sum += parseFloat( estimate );
           }
       } );
       $( group ).find( ".count" ).text( sum );
   } )
}

function enableDragAndDrop() {
   // Create a class for drop active
   createCSSSelector( ".dropZoneActive", "background-color:#ffffdd;" );
   createCSSSelector( ".dropZoneHover", "background-color: #ffffdd;border-color: #FF0000;border-style: solid; border-width: 1px;" );

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
               return draggedElement;
           },
           start: function ( event, ui ) {
               var dragStartItem = ui.helper.find( "td[class='id'] a" ).text();

               var selectedItems = $( ".context-menu-selection" ).map( function ( i, selectedIssue ) {
                   return $( selectedIssue ).find( "td[class='id'] a" ).text();
               } ).get();

               if ( $.inArray( dragStartItem, selectedItems ) == -1 ) {
                   selectedItems.push( dragStartItem );
               }

               console.log( "Dragged issues: " + selectedItems )
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
               selectedGroupValue = $( "#group_by :selected" ).val()
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

               // TODO Move row right away but applyt a "temporaty" style
               // FIXME Trigger a sum refresh
               console.log( "Assign " + draggedIssueNumbers + " to " + groupValue );
               updateIssue( draggedIssueNumbers, groupField, groupValue, function ( ids ) {
                   for ( var x = 0; x < draggedIssueNumbers.length; x++ ) {
                       var row = $( "tr:has(td[class='id'] a:contains(" + draggedIssueNumbers[x] + "))" )
                       groupRow.after( row );
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
   var queryString = "back_url=" + encodeURIComponent( "/" ) + "&" + encodeIds( issues ) + "&" + encodeURIComponent( field ) + "=" + encodeURIComponent( value )

   $.post( '/issues/bulk_update?' + queryString, {authenticity_token: $( "input[name='authenticity_token']" ).val()}, function ( data, status, jqXHR ) {
       if ( status == "success" ) {
           //window.location = window.location;
           callback()
       } else {
           console.log( "Ajax result:" + status + " - " + data );
           alert( "Update failed, see console" );
           window.location = window.location;
       }
   } )
}

$( function () {
   // FIXME Support any column
   sumByEstimatedTime();
   enableDragAndDrop();
} )
