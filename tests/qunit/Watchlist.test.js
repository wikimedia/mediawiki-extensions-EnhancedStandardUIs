window.ext = window.ext || {};

require( '../../resources/widget/provider/WatchlistItemProvider.js' );
require( '../../resources/widget/WatchlistTab.js' );

QUnit.module( 'ext.enhancedUI.watchlist', {
	beforeEach: function () {
		this.provider = new ext.enhancedUI.watchlist.provider.WatchlistItemProvider();
	}
} );

[ 1, 49, 50, 51, 100, 101, 501 ].forEach( ( count ) => {
	QUnit.test( 'Remove ' + count + ' titles within the API limit', function ( assert ) {
		const targets = Array.from( { length: count }, ( _, i ) => 'Page ' + i );
		const calls = [];
		const unwatch = this.sandbox.stub( mw.Api.prototype, 'unwatch' ).callsFake( ( batch ) => {
			calls.push( batch );
			assert.true( batch.length <= 50, 'Request does not exceed 50 titles' );
			return $.Deferred().resolve( batch.map( ( title ) => ( { title: title, watched: false } ) ) ).promise();
		} );

		return this.provider.removeCallback( targets ).then( ( results ) => {
			assert.strictEqual( unwatch.callCount, Math.ceil( count / 50 ), 'Expected number of requests' );
			assert.deepEqual( [].concat( ...calls ), targets, 'Every title removed in order' );
			assert.deepEqual( results, targets.map( ( title ) => ( { title: title, watched: false } ) ),
				'Combined API results returned' );
			assert.strictEqual( targets.length, count, 'Input array unchanged' );
		} );
	} );
} );

QUnit.test( 'Single-title removal preserves its result shape', function ( assert ) {
	const result = { title: 'Page', watched: false };
	const unwatch = this.sandbox.stub( mw.Api.prototype, 'unwatch' )
		.returns( $.Deferred().resolve( result ).promise() );

	return this.provider.removeCallback( 'Page' ).then( ( removed ) => {
		assert.true( unwatch.calledOnceWithExactly( 'Page' ), 'String passed through unchanged' );
		assert.strictEqual( removed, result, 'Single result object returned' );
	} );
} );

QUnit.test( 'Batches run sequentially and stop on failure', function ( assert ) {
	const targets = Array.from( { length: 151 }, ( _, i ) => 'Page ' + i );
	const first = $.Deferred();
	const second = $.Deferred();
	const firstStarted = $.Deferred();
	const secondStarted = $.Deferred();
	const unwatch = this.sandbox.stub( mw.Api.prototype, 'unwatch' );
	unwatch.onFirstCall().callsFake( () => {
		firstStarted.resolve();
		return first.promise();
	} );
	unwatch.onSecondCall().callsFake( () => {
		secondStarted.resolve();
		return second.promise();
	} );
	const removal = this.provider.removeCallback( targets );

	return firstStarted.then( () => {
		assert.strictEqual( unwatch.callCount, 1, 'Only the first batch is in flight' );
		first.resolve( [] );
		return secondStarted;
	} ).then( () => {
		assert.strictEqual( unwatch.callCount, 2, 'Second batch starts after first completes' );
		second.reject( 'http', { error: 'Request failed' } );
		return removal.then(
			() => {
				assert.true( false, 'Removal must not resolve after failure' );
			},
			( code, details ) => {
				assert.strictEqual( code, 'http', 'Error code propagated' );
				assert.deepEqual( details, { error: 'Request failed' }, 'Error details propagated' );
				assert.strictEqual( unwatch.callCount, 2, 'No later batches attempted' );
			}
		);
	} );
} );

[ false, true ].forEach( ( confirmed ) => {
	QUnit.test( confirmed ? 'Empty list is not submitted' : 'Cancelling does not remove items', function ( assert ) {
		this.sandbox.stub( OO.ui, 'confirm' ).returns( $.Deferred().resolve( confirmed ).promise() );
		const tab = {
			removeTargets: confirmed ? [] : [ 'Page' ],
			provider: { removeCallback: this.sandbox.spy() },
			getTypeMessage: () => ( { text: () => 'Confirm' } ),
			clearButton: { setDisabled: this.sandbox.spy() }
		};

		ext.enhancedUI.widget.WatchlistTab.prototype.onClearAll.call( tab );
		assert.false( tab.provider.removeCallback.called, 'No removal requested' );
		assert.false( tab.clearButton.setDisabled.called, 'Button remains enabled' );
	} );
} );

QUnit.test( 'Clear all waits for success before showing an empty list', function ( assert ) {
	const removal = $.Deferred();
	this.sandbox.stub( OO.ui, 'confirm' ).returns( $.Deferred().resolve( true ).promise() );
	const tab = {
		removeTargets: [ 'Page' ],
		provider: { removeCallback: this.sandbox.stub().returns( removal.promise() ) },
		getTypeMessage: () => ( { text: () => 'Confirm' } ),
		clearButton: { setDisabled: this.sandbox.spy() },
		render: this.sandbox.spy()
	};

	ext.enhancedUI.widget.WatchlistTab.prototype.onClearAll.call( tab );
	assert.true( tab.clearButton.setDisabled.calledOnceWithExactly( true ), 'Button disabled while removing' );
	assert.false( tab.render.called, 'List not cleared while removal is pending' );
	removal.resolve();
	assert.true( tab.render.calledOnceWithExactly( [] ), 'Empty list shown after success' );
} );

QUnit.test( 'Clear-all failure notifies and reloads partially removed items', function ( assert ) {
	this.sandbox.stub( OO.ui, 'confirm' ).returns( $.Deferred().resolve( true ).promise() );
	const notify = this.sandbox.stub( mw, 'notify' );
	const tab = {
		removeTargets: [ 'Page' ],
		provider: {
			removeCallback: () => $.Deferred().reject( 'http' ).promise()
		},
		getTypeMessage: () => ( { text: () => 'Confirm' } ),
		clearButton: { setDisabled: this.sandbox.spy() },
		loaded: true,
		ensureLoaded: this.sandbox.spy(),
		render: this.sandbox.spy()
	};

	ext.enhancedUI.widget.WatchlistTab.prototype.onClearAll.call( tab );
	assert.strictEqual( notify.firstCall.args[ 1 ].type, 'error', 'Error notification displayed' );
	assert.false( tab.loaded, 'Cached items invalidated' );
	assert.true( tab.ensureLoaded.calledOnce, 'Remaining items reloaded' );
	assert.false( tab.render.called, 'Failure does not show success' );
} );
