window.ext = window.ext || {};
ext.enhancedUI = ext.enhancedUI || {};
ext.enhancedUI.ve = ext.enhancedUI.ve || {};

ext.enhancedUI.ve.MediaDialogFileGrid = function ( component ) { // eslint-disable-line no-unused-vars
	ext.enhancedUI.ve.MediaDialogFileGrid.super.apply( this, arguments );
	this.lastSelectedTab = null;
	this.presetTab = null;
};

OO.inheritClass( ext.enhancedUI.ve.MediaDialogFileGrid, bs.vec.ui.plugin.MWMediaDialog );

ext.enhancedUI.ve.MediaDialogFileGrid.prototype.initialize = function () {
	this.advancedSearchTab = this.makeTabPanel();
	this.advancedSearchTab.$element.append( new OO.ui.ProgressBarWidget( { progress: false } ).$element );
	this.fileRepoGrid = null;

	this.component.searchTabs.addTabPanels( [ this.advancedSearchTab ] );

	this.component.searchTabs.on( 'set', this.onSearchTabsSet, [], this );
	this.component.connect( this, {
		beforePanelSwitch: 'onBeforePanelSwitch',
		panelSwitch: 'onPanelSwitch'
	} );
};

ext.enhancedUI.ve.MediaDialogFileGrid.prototype.makeTabPanel = function () {
	return new OO.ui.TabPanelLayout( 'enhanced-stadard-uis-ve-filegrid-panel', {
		label: ve.msg( 'enhanced-standard-uis-ve-filegrid-title' ),
		padded: false
	} );
};

ext.enhancedUI.ve.MediaDialogFileGrid.prototype.onSearchTabsSet = function ( selectedTab ) {
	this.lastSelectedTab = selectedTab.getName();
	if ( selectedTab === this.advancedSearchTab ) {
		this.component.setSize( 'larger' );
		this.component.actions.setAbilities( { cancel: true } );
		this.component.searchTabs.toggleMenu( true );
		this.component.actions.setMode( 'select' );
		this.component.search.runLayoutQueue();
	}
	this.component.updateSize();
};

ext.enhancedUI.ve.MediaDialogFileGrid.prototype.onBeforePanelSwitch = function ( panel ) {
	if ( panel !== 'search' ) {
		return;
	}
	this.presetTab = this.lastSelectedTab;
};

ext.enhancedUI.ve.MediaDialogFileGrid.prototype.onPanelSwitch = function ( panel ) {
	if ( panel === 'search' && this.presetTab === 'enhanced-stadard-uis-ve-filegrid-panel' ) {
		this.component.searchTabs.setTabPanel( this.presetTab );
		this.presetTab = null;
	}
	if ( !this.fileRepoGrid ) {
		this.initFileRepoGrid();
	}
	if ( this.fileRepoGrid ) {
		this.fileRepoGrid.closeFilters();
	}
};

ext.enhancedUI.ve.MediaDialogFileGrid.prototype.initFileRepoGrid = function () {
	this.fileRepoGrid = this.getFileGridRepo();
	this.fileRepoGrid.connect( this, {
		gridLoaded: () => {
			this.fileRepoGrid.grid.connect( this, {
				rowSelected: 'onFileRepoGridSelect'
			} );
		},
		datasetChange: () => {
			setTimeout( () => {
				const height = this.fileRepoGrid.$element.outerHeight();
				if ( height > 0 ) {
					this.component.setBodyHeight( height + 100 );
					this.component.updateSize();
				}
			}, 10 );

		}
	} );
	this.advancedSearchTab.$element.html( this.fileRepoGrid.$element );
};

ext.enhancedUI.ve.MediaDialogFileGrid.prototype.getFileGridRepo = function () {
	return new ext.enhancedUI.panel.FilelistPanel( {
		rights: [],
		canSwitchModes: false,
		enablePreview: false,
		// Prevent opening a dialog in a dialog, also VE has its own "file info"
		allowFileInfoDialog: false,
		$overlay: this.component.$overlay,
		mediaDialog: true,
		pageSize: 20
	} );
};

ext.enhancedUI.ve.MediaDialogFileGrid.prototype.onFileRepoGridSelect = function ( data ) {
	const row = data.item;
	const imageInfo = {
		title: `File:${ row.prefixed }`,
		extmetadata: [],
		user: row.author,
		timestamp: row.formatted_ts,
		descriptionurl: row.url,
		url: row.fileUrl,
		mediatype: row.media_type,
		width: row.width,
		height: row.height,
		thumburl: row.fileUrl,
		thumbwidth: 80
	};
	this.component.chooseImageInfo( imageInfo );
};
