ext = ext || {};
ext.enhancedUI = ext.enhancedUI || {};
ext.enhancedUI.data = ext.enhancedUI.data || {};

require( './PagesTreeItem.js' );

ext.enhancedUI.data.PagesTree = function ( cfg ) {
	cfg = cfg || {};
	cfg.id = 'enhanced-pages-tree';
	cfg.allowDeletions = false;
	cfg.allowAdditions = false;
	cfg.data = this.prepareData( cfg.pages );
	cfg.fixed = true;

	ext.enhancedUI.data.PagesTree.super.call( this, cfg );

	this.store = cfg.store;
};

OO.inheritClass( ext.enhancedUI.data.PagesTree, OOJSPlus.ui.data.Tree );

ext.enhancedUI.data.PagesTree.prototype.build = function ( data, lvl ) {
	var nodes = {};
	lvl = lvl || 0;
	for ( var i = 0; i < data.length; i++ ) {
		var item = data[ i ],
			isLeaf = true,
			expanded = false;

		// eslint-disable-next-line no-prototype-builtins
		if ( ( item.hasOwnProperty( 'leaf' ) && item.leaf === false ) &&
			// eslint-disable-next-line no-prototype-builtins
			( item.hasOwnProperty( 'children' ) && item.children.length > 0 )
		) {
			isLeaf = false;
			expanded = true;
		}
		var widget = this.createItemWidget( item, lvl, isLeaf,
			this.idGenerator.generate(), expanded );
		widget.connect( this, {
			selected: function ( element ) {
				this.setSelected( element );
			}
		} );

		// eslint-disable-next-line es-x/no-array-prototype-flat
		this.flat[ widget.getName() ] = widget;
		nodes[ widget.getName() ] = {
			widget: widget,
			children: !isLeaf ? this.build( item.children || [], lvl + 1 ) : {}
		};
	}

	return nodes;
};

ext.enhancedUI.data.PagesTree.prototype.createItemWidget = function (
	item, lvl, isLeaf, labelledby, expanded ) {
	return new ext.enhancedUI.data.PagesTreeItem( $.extend( {}, {
		level: lvl,
		leaf: isLeaf,
		tree: this,
		labelledby: labelledby,
		expanded: expanded,
		style: this.style
	}, item ) );
};

OOJSPlus.ui.data.Tree.prototype.expandNode = function ( name ) {
	var node = this.getItem( name );
	if ( !node ) {
		return;
	}

	var $element = node.$element.find( '> ul.tree-node-list' );
	if ( $( $element[ 0 ] ).children().length === 0 ) {
		this.store.getSubpages( node.elementId ).done( function ( result ) {
			var data = this.prepareData( result );
			var nodes = this.build( data, node.level + 1 );

			for ( var nodeElement in nodes ) {
				// eslint-disable-next-line no-prototype-builtins
				if ( !nodes.hasOwnProperty( nodeElement ) ) {
					continue;
				}
				var $li = nodes[ nodeElement ].widget.$element;
				var $labelEl = $( $li ).find( '> div > .oojsplus-data-tree-label' );
				var itemId = $labelEl.attr( 'id' );
				$li.append( this.doDraw( nodes[ nodeElement ].children || {},
					nodes[ nodeElement ].widget, itemId, this.expanded ) );
				$( $element ).append( $li );
				this.reEvaluateParent( nodeElement );
				$( $element ).show();
				$( node.$element ).attr( 'aria-expanded', 'true' );
			}
		}.bind( this ) );
	} else {
		$( $element ).show();
		$( node.$element ).attr( 'aria-expanded', 'true' );
	}
};

OOJSPlus.ui.data.Tree.prototype.prepareData = function ( pages ) {
	var data = [];
	for ( var i in pages ) {
		var title = pages[ i ].title.split( '/' );
		var label = title[ title.length - 1 ];
		if ( pages[ i ].display_title.length > 0 ) {
			label = pages[ i ].display_title;
		}

		var entry = {
			id: pages[ i ].id,
			title: pages[ i ].prefixed,
			name: pages[ i ].id,
			href: pages[ i ].url,
			leaf: pages[ i ].leaf,
			label: label,
			exists: pages[ i ].exists,
			redirect: pages[ i ].redirect
		};
		if ( pages[ i ].children.length > 0 ) {
			entry.children = this.prepareData( pages[ i ].children );
		}
		if ( pages[ i ].watch !== undefined ) {
			entry.watch = pages[ i ].watch;
		}
		data.push( entry );
	}
	return data;
};
