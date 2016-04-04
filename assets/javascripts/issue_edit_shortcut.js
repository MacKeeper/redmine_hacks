function setupKeyShortcut() {
  $( document ).keypress( function ( event ) {
    if ( !event.altKey && ($( event.target ).is( "input" ) || $( event.target ).is( "textarea" )) ) {
      return;
    }
    switch ( event.charCode ) {
      // e
      case 101:
        showAndScrollTo( "update", "issue_notes" );
        return false;

      // Enter
      case 13:
        $( "#issue-form" ).submit();
        return false;
    }
  } )
}

$( function () {
  setupKeyShortcut();
} );