ext = ext || {};
ext.enhancedUI = ext.enhancedUI || {};
ext.enhancedUI.widget = ext.enhancedUI.widget || {};

ext.enhancedUI.widget.HistoryGrid = function ( cfg ) {
	cfg.multiSelect = true;
	this.selectionLimit = 2;
	this.gridState = cfg.gridState || null;
	ext.enhancedUI.widget.HistoryGrid.super.call( this, cfg );
};

OO.inheritClass( ext.enhancedUI.widget.HistoryGrid, OOJSPlus.ui.data.GridWidget );

ext.enhancedUI.widget.HistoryGrid.prototype.clickOnRow = function ( e ) {
	let positionInArray = -1;
	if ( this.selectedRows.length > 0 ) {
		positionInArray = this.selectedRows.indexOf( e.data.item );
	}
	if ( positionInArray >= 0 ) {
		this.selectedRows.splice( positionInArray, 1 );
		if ( this.selectedRows.length < this.selectionLimit ) {
			this.toggleRowSelectionButton( false );
		}
	} else {
		if ( this.selectedRows.length <= this.selectionLimit - 1 ) {
			this.selectedRows.push( e.data.item );
		}

		if ( this.selectedRows.length === this.selectionLimit ) {
			this.toggleRowSelectionButton( true );
		}
	}
	this.emit( 'rowSelected', e.data );
};

ext.enhancedUI.widget.HistoryGrid.prototype.toggleRowSelectionButton = function ( selection ) {
	const $tbody = $( this.$table ).find( 'tbody' ),
		$rows = $tbody.find( 'tr' );
	for ( let i = 0; i < $rows.length; i++ ) {
		const $row = $( $rows[ i ] );
		const rowId = parseInt( $( $row ).attr( 'id' ) );
		const positionInArray = this.selectedRows.map( ( e ) => parseInt( e.id ) ).indexOf( rowId );
		if ( positionInArray < 0 ) {
			const $input = $( $row ).find( 'input' );
			if ( selection ) {
				this.disableElement( $input );
			} else {
				this.enableElement( $input );
			}
		}
	}
};

ext.enhancedUI.widget.HistoryGrid.prototype.disableElement = function ( $checkbox ) {
	$( $checkbox ).attr( 'aria-disabled', true );
	$( $checkbox ).attr( 'disabled', true );

	$( $checkbox ).parent().attr( 'aria-disabled', true );
	$( $checkbox ).parent().addClass( 'oo-ui-widget-disabled' );
	/* eslint-disable-next-line no-jquery/no-class-state */
	if ( $( $checkbox ).parent().hasClass( 'oo-ui-widget-enabled' ) ) {
		$( $checkbox ).parent().removeClass( 'oo-ui-widget-enabled' );
	}
};

ext.enhancedUI.widget.HistoryGrid.prototype.enableElement = function ( $checkbox ) {
	if ( $( $checkbox ).has( 'disabled' ) ) {
		$( $checkbox ).removeAttr( 'disabled' );
	}
	if ( $( $checkbox ).has( 'aria-disabled' ) ) {
		$( $checkbox ).removeAttr( 'aria-disabled' );
	}
	if ( $( $checkbox ).parent().has( 'aria-disabled' ) ) {
		$( $checkbox ).parent().removeAttr( 'aria-disabled' );
	}
	/* eslint-disable-next-line no-jquery/no-class-state */
	if ( $( $checkbox ).parent().hasClass( 'oo-ui-widget-disabled' ) ) {
		$( $checkbox ).parent().removeClass( 'oo-ui-widget-disabled' );
	}

	$( $checkbox ).parent().addClass( 'oo-ui-widget-enabled' );
};

ext.enhancedUI.widget.HistoryGrid.prototype.getItemID = function ( item ) {
	return item.id;
};

ext.enhancedUI.widget.HistoryGrid.prototype.selectionLimitReached = function () {
	if ( this.selectedRows.length === this.selectionLimit ) {
		return true;
	}
	return false;
};

ext.enhancedUI.widget.HistoryGrid.prototype.getStateIfApplicable = function () {
	return this.gridState || {};
};

ext.enhancedUI.widget.HistoryGrid.prototype.onStateChange = function ( state ) {
	mws.datastash.setGlobal( 'enhanced-history-state', state );
};
