ext = ext || {};
ext.enhancedUI = ext.enhancedUI || {};
ext.enhancedUI.data = ext.enhancedUI.data || {};

ext.enhancedUI.data.PagesTreeItem = function ( cfg ) {
	cfg.style.IconExpand = 'next';
	cfg.style.IconCollapse = 'expand';
	cfg.classes = cfg.classes || [];
	if ( !cfg.exists ) {
		cfg.classes.push( 'new' );
	}
	this.redirect = cfg.redirect || '0';
	this.exists = cfg.exists;
	ext.enhancedUI.data.PagesTreeItem.parent.call( this, cfg );
	this.expanded = cfg.expanded;
	this.children = [];
};

OO.inheritClass( ext.enhancedUI.data.PagesTreeItem, OOJSPlus.ui.data.tree.Item );

ext.enhancedUI.data.PagesTreeItem.prototype.possiblyAddExpander = function () {
	if ( !this.leaf && !this.expander ) {
		this.expander = new OOJSPlus.ui.widget.ButtonWidget( {
			role: 'button',
			framed: false,
			icon: this.expanded ? this.style.IconCollapse : this.style.IconExpand,
			label: mw.message( 'enhanced-standard-uis-allpages-page-tree-item-expander-label' ).text(),
			invisibleLabel: true,
			classes: [ 'oojsplus-data-tree-expander' ]
		} );

		this.expander.$button.attr( 'aria-expanded', this.expanded );
		this.expander.connect( this, {
			click: 'onExpanderClick'
		} );
		this.$wrapper.prepend( this.expander.$element );
	} else if ( this.expander ) {
		this.expander.$element.remove();
		this.expander = null;
	}
};

ext.enhancedUI.data.PagesTreeItem.prototype.init = function () {
	ext.enhancedUI.data.PagesTreeItem.parent.prototype.init.call( this );
	this.addRedirectIcon();
	this.addPageInfo();
	this.addWatchIcon();
};

ext.enhancedUI.data.PagesTreeItem.prototype.addRedirectIcon = function () {
	if ( this.redirect === '0' ) {
		return;
	}
	this.redirectIcon = new OO.ui.IconWidget( {
		label: mw.message( 'enhanced-standard-uis-allpages-redirect-title' ).text(),
		invisibleLabel: true,
		icon: 'share',
		classes: [ 'oojsplus-data-tree-page-redirect' ]
	} );
	$( this.labelWidget.$link ).attr( 'aria-label',
		mw.message( 'enhanced-standard-uis-allpages-redirect-label', this.buttonCfg.title ).text() );
	this.$wrapper.append( this.redirectIcon.$element );
};

ext.enhancedUI.data.PagesTreeItem.prototype.addPageInfo = function () {
	if ( !this.exists ) {
		return;
	}

	this.pageInfo = new OOJSPlus.ui.widget.ButtonWidget( {
		framed: false,
		label: mw.message( 'enhanced-standard-uis-allpages-pageinfo-label', this.buttonCfg.title ).text(),
		invisibleLabel: true,
		role: 'button',
		icon: 'info',
		href: mw.util.getUrl( this.buttonCfg.title, {
			action: 'info'
		} ),
		classes: [ 'oojsplus-data-tree-page-action', 'page-tree-action-info' ]
	} );
	$( this.pageInfo.$element ).attr( 'data-title', this.buttonCfg.title );

	this.$wrapper.append( this.pageInfo.$element );
};

ext.enhancedUI.data.PagesTreeItem.prototype.addWatchIcon = function () {
	if ( !this.exists || this.buttonCfg.watch === undefined ) {
		return;
	}

	this.watched = !!this.buttonCfg.watch;
	this.watch = new OOJSPlus.ui.widget.ButtonWidget( {
		framed: false,
		role: 'button',
		label: this.getWatchLabel(),
		invisibleLabel: true,
		data: {
			title: this.buttonCfg.title
		},
		classes: [ 'oojsplus-data-tree-page-action', 'page-tree-action-watch' ]
	} );
	this.updateWatchButtonState();
	this.$wrapper.append( this.watch.$element );
	this.watch.connect( this, {
		click: 'onWatchIconClick'
	} );
};

ext.enhancedUI.data.PagesTreeItem.prototype.getWatchLabel = function () {
	return mw.message(
		this.watched ?
			'enhanced-standard-uis-allpages-unwatch-label' :
			'enhanced-standard-uis-allpages-watch-label',
		this.buttonCfg.title
	).text();
};

ext.enhancedUI.data.PagesTreeItem.prototype.updateWatchButtonState = function () {
	const label = this.getWatchLabel();
	this.watch.setLabel( label );
	this.watch.setTitle( label );
	this.watch.$button.attr( 'aria-pressed', this.watched ? 'true' : 'false' );
	this.watch.$element.toggleClass( 'page-tree-action-is-watched', this.watched );
};

ext.enhancedUI.data.PagesTreeItem.prototype.onExpanderClick = function () {
	if ( this.expanded ) {
		this.tree.collapseNode( this.getName() );
		this.expander.setIcon( this.style.IconExpand );
		this.expander.$button.attr( 'aria-expanded', 'false' );
		this.expanded = false;
	} else {
		this.tree.expandNode( this.getName() );
		this.expander.setIcon( this.style.IconCollapse );
		this.expander.$button.attr( 'aria-expanded', 'true' );
		this.expanded = true;
	}
};

ext.enhancedUI.data.PagesTreeItem.prototype.onWatchIconClick = function () {
	const title = this.watch.data.title;
	const watch = !this.watched;
	this.watch.setDisabled( true );
	mw.loader.using( 'mediawiki.api' ).done( () => {
		const api = new mw.Api();
		const apiCall = watch ? api.watch( title ) : api.unwatch( title );
		apiCall.done( () => {
			this.watched = watch;
			this.updateWatchButtonState();
			mw.notify( mw.message(
				watch ? 'addedwatchtext-short' : 'removedwatchtext-short', title
			).text() );
		} ).always( () => {
			this.watch.setDisabled( false );
		} );
	} );
};
