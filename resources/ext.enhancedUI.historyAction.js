( function ( mw, $ ) {

	$( function () {
		require( './panel/HistoryPanel.js' );
		mw.user.getRights().done( function ( rights ) {
			/* eslint-disable-next-line no-jquery/no-global-selector */
			var $historyCnt = $(
				'#enhanced-history-cnt[data-history]'
			);
			var cfg = {
				rights: rights,
				data: $historyCnt.data( 'history' )
			};
			var historyGrid = new ext.enhancedUI.panel.HistoryPanel( cfg );
			$historyCnt.append( historyGrid.$element );
		} );
	} );
}( mediaWiki, jQuery ) );
