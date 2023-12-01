ext = ext || {};
ext.enhancedUI = ext.enhancedUI || {};
ext.enhancedUI.panel = ext.enhancedUI.panel || {};

require( '../widget/Paginator.js' );
require( '../widget/NamespacesMenu.js' );
require( '../data/PagesTree.js' );
require( '../data/store/Store.js' );

ext.enhancedUI.panel.AllPagesPanel = function ( cfg ) {
	ext.enhancedUI.panel.AllPagesPanel.super.apply( this, cfg );
	this.pageSize = 50;
	this.store = new ext.enhancedUI.data.store.Store();
	this.$element = $( '<div>' ).addClass( 'enhanced-ui-allpages-panel' );

	this.searchWidget = OO.ui.infuse( '#enhanced-ui-allpages-filter' );
	this.searchWidget.connect( this, {
		change: 'onFilterInput'
	} );

	this.setupWidgets();
	this.getPages();
};

OO.inheritClass( ext.enhancedUI.panel.AllPagesPanel, OO.ui.PanelLayout );

ext.enhancedUI.panel.AllPagesPanel.prototype.setupWidgets = function () {
	this.setupMenu();
	this.$contentCnt = $( '<div>' ).addClass( 'enhanced-ui-allpages-panel-content' );
	this.setupPaginator();
	this.setupTree();
	this.$element.append( this.$contentCnt );
};

ext.enhancedUI.panel.AllPagesPanel.prototype.setupMenu = function () {
	var $menuCnt = $( '<div>' ).addClass( 'enhanced-ui-allpages-panel-menu' );
	this.namespaceMenu = new ext.enhancedUI.widget.NamespacesMenu();
	this.selectedNS = this.namespaceMenu.getSelectedNamespaceId();
	this.includeRedirect = this.namespaceMenu.getRedirectStatus();
	this.namespaceMenu.connect( this, {
		select: 'namespaceSelected',
		redirectChange: 'updateRedirect'
	} );
	$menuCnt.append( this.namespaceMenu.$element );
	this.$element.append( $menuCnt );
};

ext.enhancedUI.panel.AllPagesPanel.prototype.setupPaginator = function () {
	var $paginatorCnt = $( '<div>' ).addClass( 'enhanced-ui-allpages-panel-paginator' );
	this.paginator = new ext.enhancedUI.widget.Paginator();
	this.paginator.connect( this, {
		selectPage: function ( nextPage ) {
			this.changeFromPaginator = true;
			this.getPages( nextPage * this.pageSize );
		}
	} );
	$paginatorCnt.append( this.paginator.$element );
	this.$contentCnt.append( $paginatorCnt );
};

ext.enhancedUI.panel.AllPagesPanel.prototype.setupTree = function () {
	this.$treeCnt = $( '<div>' ).addClass(
		'enhanced-ui-allpages-panel-tree enhanced-ui-allpages-columns' );
	this.$contentCnt.append( this.$treeCnt );
};

ext.enhancedUI.panel.AllPagesPanel.prototype.namespaceSelected = function ( nsId ) {
	if ( this.selectedNS === nsId ) {
		return;
	}
	this.selectedNS = nsId;
	this.getPages();
};

ext.enhancedUI.panel.AllPagesPanel.prototype.updateRedirect = function ( redirect ) {
	if ( this.includeRedirect === redirect ) {
		return;
	}
	this.includeRedirect = redirect;
	this.getPages();
};

ext.enhancedUI.panel.AllPagesPanel.prototype.getPages = function ( start ) {
	start = start || 0;
	this.store.loadNS( this.selectedNS, start ).done( function ( data ) {
		var sortedData = this.sortData( data );
		this.pages = sortedData;
		if ( this.changeFromPaginator !== true ) {
			this.paginator.init( Math.ceil( this.store.getTotal() / this.pageSize ) );
		}
		this.changeFromPaginator = false;
		this.updatePages();
	}.bind( this ) );
};

ext.enhancedUI.panel.AllPagesPanel.prototype.updatePages = function () {
	this.$treeCnt.children().remove();
	if ( this.pages.length > 1 ) {
		// eslint-disable-next-line no-jquery/no-class-state
		if ( !$( this.$treeCnt ).hasClass( 'enhanced-ui-allpages-columns' ) ) {
			$( this.$treeCnt ).addClass( 'enhanced-ui-allpages-columns' );
		}
	} else {
		// eslint-disable-next-line no-jquery/no-class-state
		if ( $( this.$treeCnt ).hasClass( 'enhanced-ui-allpages-columns' ) ) {
			$( this.$treeCnt ).removeClass( 'enhanced-ui-allpages-columns' );
		}
	}
	for ( var i in this.pages ) {
		var pageTreeLetter = new OO.ui.LabelWidget( {
			label: this.alphabetIndex[ i ]
		} );
		var pageTree = new ext.enhancedUI.data.PagesTree( {
			style: {
				IconExpand: 'next',
				IconCollapse: 'expand'
			},
			pages: this.pages[ i ],
			store: this.store
		} );
		this.$treeCnt.append( pageTreeLetter.$element );
		this.$treeCnt.append( pageTree.$element );
	}
};

ext.enhancedUI.panel.AllPagesPanel.prototype.onFilterInput = function () {
	var searchString = this.searchWidget.getValue();
	this.store.loadPages( this.selectedNS, searchString ).done( function ( data ) {
		var sortedData = this.sortData( data );
		this.pages = sortedData;
		this.paginator.init( Math.ceil( this.store.getTotal() / this.pageSize ) );
		this.updatePages();
	}.bind( this ) );
};

ext.enhancedUI.panel.AllPagesPanel.prototype.sortData = function ( data ) {
	this.alphabetIndex = [];
	if ( Object.keys( data ).length === 0 ) {
		return [];
	}
	var alphabetValue = [];
	var sortedData = [];
	var lastLetter = data[ 0 ].dbkey.slice( 0, 1 );
	for ( var i in data ) {
		if ( !this.includeRedirect && data[ i ].redirect === '1' ) {
			continue;
		}
		var startLetter = data[ i ].dbkey.slice( 0, 1 );
		if ( lastLetter !== startLetter ) {
			sortedData.push( alphabetValue );
			alphabetValue = [];
		}
		if ( this.alphabetIndex.indexOf( startLetter ) === -1 ) {
			this.alphabetIndex.push( startLetter );
		}
		alphabetValue.push( data[ i ] );
		lastLetter = startLetter;
	}
	sortedData.push( alphabetValue );
	return sortedData;
};
