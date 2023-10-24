ext = ext || {};
ext.enhancedUI = ext.enhancedUI || {};
ext.enhancedUI.widget = ext.enhancedUI.widget || {};

ext.enhancedUI.widget.HistoryGrid = function ( cfg ) {
	cfg.multiSelect = true;
	this.selectionLimit = 2;
	ext.enhancedUI.widget.HistoryGrid.super.call( this, cfg );
};

OO.inheritClass( ext.enhancedUI.widget.HistoryGrid, OOJSPlus.ui.data.GridWidget );

ext.enhancedUI.widget.HistoryGrid.prototype.clickOnRow = function ( e ) {
	var positionInArray = -1;
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
	for ( var i = 0; i < $( this.$table ).children().length; i++ ) {
		var $row = $( this.$table ).children()[ i ];
		if ( $row.tagName !== 'TR' ) {
			continue;
		}
		var rowId = parseInt( $( $row ).attr( 'id' ) );
		var positionInArray = this.selectedRows.map( function ( e ) {
			return parseInt( e.id );
		} ).indexOf( rowId );
		if ( positionInArray < 0 ) {
			var $input = $( $row ).find( 'input' );
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
