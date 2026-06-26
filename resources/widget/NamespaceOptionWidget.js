ext = ext || {};
ext.enhancedUI = ext.enhancedUI || {};
ext.enhancedUI.widget = ext.enhancedUI.widget || {};

ext.enhancedUI.widget.NamespaceOptionWidget = function ( cfg ) {
	cfg = cfg || {};
	cfg.classes = [ 'enhanced-namespace-option-widget' ];
	ext.enhancedUI.widget.NamespaceOptionWidget.super.call( this, cfg );

	this.nsId = cfg.data;
	this.nsLabel = cfg.label;

	this.$actions = $( '<div>' ).addClass( 'enhanced-namespace-option-actions' );

	this.setupWatchButton( cfg.watch || false );

	this.$badge = $( '<span>' ).text( cfg.count || 0 );
	this.$badge.attr( 'aria-label', mw.message(
		'enhanced-standard-uis-allpages-namespace-badge-aria-label', cfg.count ).text() );
	this.$badge.addClass( 'enhanced-namespace-option-badge' );
	this.$actions.append( this.$badge );

	this.$element.append( this.$actions );
};

OO.inheritClass( ext.enhancedUI.widget.NamespaceOptionWidget, OO.ui.MenuOptionWidget );

ext.enhancedUI.widget.NamespaceOptionWidget.prototype.setupWatchButton = function ( watched ) {
	if ( mw.user.isAnon() ) {
		return;
	}
	this.watched = watched;
	this.watchButton = new OO.ui.ButtonWidget( {
		framed: false,
		invisibleLabel: true,
		label: this.getWatchLabel(),
		classes: [ 'enhanced-namespace-option-watch' ],
		tabIndex: -1
	} );
	this.updateWatchButtonState();
	this.watchButton.connect( this, {
		click: 'onWatchClick'
	} );
	this.$actions.append( this.watchButton.$element );
};

/**
 * Include or exclude the watch button from the tab order. Called by NamespacesMenu when
 * the keyboard highlight moves, so only the currently highlighted option's watch button
 * is reachable via Tab.
 *
 * @param {boolean} tabbable
 */
ext.enhancedUI.widget.NamespaceOptionWidget.prototype.setWatchButtonTabbable = function ( tabbable ) {
	if ( this.watchButton ) {
		this.watchButton.setTabIndex( tabbable ? 0 : -1 );
	}
};

ext.enhancedUI.widget.NamespaceOptionWidget.prototype.getWatchLabel = function () {
	return mw.message(
		this.watched ?
			'enhanced-standard-uis-allpages-namespace-unwatch-label' :
			'enhanced-standard-uis-allpages-namespace-watch-label',
		this.nsLabel
	).text();
};

ext.enhancedUI.widget.NamespaceOptionWidget.prototype.updateWatchButtonState = function () {
	this.watchButton.setLabel( this.getWatchLabel() );
	this.watchButton.$button.attr( 'aria-pressed', this.watched ? 'true' : 'false' );
	this.$element.toggleClass( 'enhanced-namespace-option-is-watched', this.watched );
};

ext.enhancedUI.widget.NamespaceOptionWidget.prototype.onWatchClick = function () {
	const watch = !this.watched;
	this.watchButton.setDisabled( true );
	mw.loader.using( [ 'ext.enhancedstandarduis.api' ] ).done( () => {
		const api = new ext.enhancedUI.api.Api();
		api.watchNamespace( this.nsId, watch ).done( () => {
			this.watched = watch;
			this.updateWatchButtonState();
			mw.notify( mw.message(
				watch ?
					'enhanced-standard-uis-allpages-namespace-watched' :
					'enhanced-standard-uis-allpages-namespace-unwatched',
				this.nsLabel
			).text() );
		} ).fail( () => {
			mw.notify(
				mw.message( 'enhanced-standard-uis-allpages-namespace-watch-error' ).text(),
				{ type: 'error' }
			);
		} ).always( () => {
			this.watchButton.setDisabled( false );
		} );
	} );
};
