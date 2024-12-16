window.ext = window.ext || {};
ext.enhancedUI = ext.enhancedUI || {};
ext.enhancedUI.ve = ext.enhancedUI.ve || {};

bs.vec.registerComponentPlugin(
	bs.vec.components.MEDIA_DIALOG,
	function( component ) {
		return new ext.enhancedUI.ve.MediaDialogFileGrid( component );
	}
);