( function ( mw, $ ) {

	$( function () {
		require( './panel/AllPagesPanel.js' );
		/* eslint-disable-next-line no-jquery/no-global-selector */
		var $allPagesCnt = $( '#enhanced-ui-allpages-cnt' );
		var allPagesPanel = new ext.enhancedUI.panel.AllPagesPanel();
		$allPagesCnt.append( allPagesPanel.$element );

		var paginatorOffsetJson = require( './addPaginatorOffset.json' );
		var paginatorOffsetHeight = paginatorOffsetJson.offsetHeight;
		var floatingPaginator = false;
		var rightPos = getRightValue();
		var $paginator = $( '.enhanced-ui-allpages-panel-paginator' ); // eslint-disable-line no-jquery/no-global-selector
		var topValue = $( $paginator ).offset().top;

		$( window ).on( 'scroll', function () {
			var windowTop = $( this ).scrollTop();
			if ( windowTop > topValue ) {
				if ( !floatingPaginator ) {
					$paginator.css( 'top', paginatorOffsetHeight );
					$paginator.css( 'position', 'fixed' );
					$paginator.css( 'right', rightPos );
					floatingPaginator = true;
				}
			} else {
				if ( floatingPaginator ) {
					$paginator.removeAttr( 'style' );
					floatingPaginator = false;
				}
			}
		} );
	} );

	function getRightValue() {
		// eslint-disable-next-line no-jquery/no-global-selector
		var $mainValue = $( '#mw-content-text' ).offset().left + $( '#mw-content-text' ).width();
		return $( document ).width() - $mainValue;
	}
}( mediaWiki, jQuery ) );
