ext = ext || {};
ext.enhancedUI = ext.enhancedUI || {};
ext.enhancedUI.widget = ext.enhancedUI.widget || {};

require( './NamespaceOptionWidget.js' );

ext.enhancedUI.widget.NamespacesMenu = function ( cfg ) {
	cfg = cfg || {};
	ext.enhancedUI.widget.NamespacesMenu.super.call( this, cfg );
	this.namespaces = require( './namespaceConfig.json' );
	this.namespaces[ 0 ].name = mw.message( 'blanknamespace' ).text();
	this.setup();

};

OO.inheritClass( ext.enhancedUI.widget.NamespacesMenu, OO.ui.Widget );

ext.enhancedUI.widget.NamespacesMenu.prototype.setup = function () {
	this.setupConfigButton();
	this.setupNamespaceMenu();
};

ext.enhancedUI.widget.NamespacesMenu.prototype.setupConfigButton = function () {
	var popupContent = this.getPopupContent();
	this.configPopupButton = new OO.ui.PopupButtonWidget( {
		icon: 'settings',
		framed: false,
		popup: popupContent
	} );
	var fieldlayout = new OO.ui.FieldLayout( this.configPopupButton, {
		align: 'inline',
		label: mw.message( 'enhanced-standard-uis-allpages-config' ).text(),
		classes: [ 'enhanced-ui-allpages-config-header' ]
	} );
	this.$element.append( fieldlayout.$element );
};

ext.enhancedUI.widget.NamespacesMenu.prototype.setupNamespaceMenu = function () {
	this.selectWidget = new OO.ui.OutlineSelectWidget();
	this.selectWidget.connect( this, {
		select: 'namespaceSelection'
	} );
	this.updateNSMenu();

	this.menuPanel = new OO.ui.PanelLayout( {
		expanded: false,
		scrollable: true,
		$content: this.selectWidget.$element
	} );

	this.$element.append( this.menuPanel.$element );
};

ext.enhancedUI.widget.NamespacesMenu.prototype.getPopupContent = function () {
	this.includeTalkNS = new OOJSPlus.ui.widget.CheckboxInputWidget();
	this.includeTalkNS.connect( this, {
		change: 'updateNSMenu'
	} );
	var includeTalkLayout = new OO.ui.FieldLayout(
		this.includeTalkNS,
		{
			label: mw.message( 'enhanced-standard-uis-allpages-include-talk-ns' ).text(),
			align: 'inline'
		}
	);
	this.includeNonContentNS = new OOJSPlus.ui.widget.CheckboxInputWidget();
	this.includeNonContentNS.connect( this, {
		change: 'updateNSMenu'
	} );
	var includeNonContentLayout = new OO.ui.FieldLayout(
		this.includeNonContentNS,
		{
			label: mw.message( 'enhanced-standard-uis-allpages-include-non-content-ns' ).text(),
			align: 'inline'
		}
	);
	this.includeRedirect = new OOJSPlus.ui.widget.CheckboxInputWidget( {
		selected: true
	} );
	this.includeRedirect.connect( this, {
		change: 'updateRedirect'
	} );
	var includeRedirectsLayout = new OO.ui.FieldLayout(
		this.includeRedirect,
		{
			label: mw.message( 'enhanced-standard-uis-allpages-include-redirect' ).text(),
			align: 'inline'
		}
	);
	var $content = $( '<div>' );
	$content.append( includeTalkLayout.$element );
	$content.append( includeNonContentLayout.$element );
	$content.append( includeRedirectsLayout.$element );
	return {
		head: true,
		label: mw.message( 'enhanced-standard-uis-allpages-config-ns' ).text(),
		padded: true,
		align: 'forwards',
		autoFlip: false,
		$content: $content
	};
};

ext.enhancedUI.widget.NamespacesMenu.prototype.updateNSMenu = function () {
	var selectedItem = this.selectWidget.findFirstSelectedItem();
	this.selectWidget.clearItems();
	this.nsOptions = [];
	var includeNonContent = this.includeNonContentNS.isSelected();
	var includeTalk = this.includeTalkNS.isSelected();

	for ( var nsId in this.namespaces ) {
		var namespace = this.namespaces[ nsId ];
		if ( includeTalk && namespace.isTalk ) {
			var relatedNS = this.namespaces[ nsId - 1 ];
			if ( !relatedNS.isContent && !includeNonContent ) {
				continue;
			}
			this.nsOptions.push(
				new ext.enhancedUI.widget.NamespaceOptionWidget( {
					data: namespace.id,
					label: namespace.name,
					count: namespace.pageCount
				} )
			);
			continue;
		}
		if ( ( !includeNonContent && !namespace.isContent ) ||
			( includeNonContent && namespace.isTalk ) ) {
			continue;
		}
		this.nsOptions.push(
			new ext.enhancedUI.widget.NamespaceOptionWidget( {
				data: namespace.id,
				label: namespace.name,
				count: namespace.pageCount
			} )
		);
	}
	this.selectWidget.addItems( this.nsOptions );
	this.selectWidget.selectItemByData( selectedItem ? selectedItem.data : 0 );
};

ext.enhancedUI.widget.NamespacesMenu.prototype.getSelectedNamespaceId = function () {
	var nsOption = this.selectWidget.findSelectedItem();
	return nsOption.data;
};

ext.enhancedUI.widget.NamespacesMenu.prototype.namespaceSelection = function () {
	var nsOption = this.selectWidget.findSelectedItem();
	this.emit( 'select', nsOption.data );
};

ext.enhancedUI.widget.NamespacesMenu.prototype.updateRedirect = function () {
	this.emit( 'redirectChange', this.includeRedirect.isSelected() );
};

ext.enhancedUI.widget.NamespacesMenu.prototype.getRedirectStatus = function () {
	return this.includeRedirect.isSelected();
};
