( function ( mw, $ ) {
	$( async () => {
		await mw.loader.using( [ 'mediawiki.user', 'ext.enhancedstandarduis.filelist.panel' ] );
		// TODO: this is not great for performance, can be part of the container dataset already
		const rights = await mw.user.getRights();
		const cfg = {
			rights: rights
		};

		try {
			cfg.gridState = await mws.datastash.getGlobal( 'enhanced-ui-filelist-state' );
		} catch ( e ) {
			cfg.gridState = null;
		}

		/* eslint-disable-next-line no-jquery/no-global-selector */
		const $allFilesCnt = $( '#enhanced-ui-filelist-cnt' );
		const filesPanel = new ext.enhancedUI.panel.FilelistPanel( cfg );
		$( $allFilesCnt ).append( filesPanel.$element );
	} );

}( mediaWiki, jQuery ) );
