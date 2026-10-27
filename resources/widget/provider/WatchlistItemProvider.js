ext = ext || {};
ext.enhancedUI = ext.enhancedUI || {};
ext.enhancedUI.watchlist = ext.enhancedUI.watchlist || {};
ext.enhancedUI.watchlist.provider = ext.enhancedUI.watchlist.provider || {};

require( '../../api/Api.js' );

/**
 * Base watchlist item provider. Tab metadata comes from the server-side registration
 * (passed in via cfg); item data and the default removal are served by the REST API.
 *
 * Extensions that need individual removal behaviour register a subclass via the
 * `module`/`providerClass` keys of the WatchlistItemProviders attribute and override
 * `removeCallback`.
 *
 * @param {Object} cfg key, title, icon, addItemsUrl
 */
ext.enhancedUI.watchlist.provider.WatchlistItemProvider = function ( cfg ) {
	cfg = cfg || {};
	this.key = cfg.key;
	this.title = cfg.title;
	this.icon = cfg.icon;
	this.addItemsUrl = cfg.addItemsUrl || null;
	this.api = new ext.enhancedUI.api.Api();
};

OO.initClass( ext.enhancedUI.watchlist.provider.WatchlistItemProvider );

ext.enhancedUI.watchlist.provider.WatchlistItemProvider.prototype.getKey = function () {
	return this.key;
};

ext.enhancedUI.watchlist.provider.WatchlistItemProvider.prototype.getTabTitle = function () {
	return this.title;
};

ext.enhancedUI.watchlist.provider.WatchlistItemProvider.prototype.getTabIcon = function () {
	return this.icon;
};

/**
 * @return {string|null} Where the user can start watching items of this type
 */
ext.enhancedUI.watchlist.provider.WatchlistItemProvider.prototype.getAddItemsUrl = function () {
	return this.addItemsUrl;
};

/**
 * @return {jQuery.Promise} Resolves with { sections: [ { section, items } ] }
 */
ext.enhancedUI.watchlist.provider.WatchlistItemProvider.prototype.getItems = function () {
	return this.api.getWatchlistItems( this.key );
};

/**
 * Remove one or more items from the watchlist. Uses the standard MediaWiki unwatch API,
 * which writes to the `watchlist` table (and handles the CSRF token). Override for
 * provider-specific behaviour. Arrays are removed sequentially in batches of at most
 * 50 titles to respect the API limit for users without the apihighlimits right.
 *
 * @param {string|string[]} target Prefixed title, or array of titles
 * @return {jQuery.Promise}
 */
ext.enhancedUI.watchlist.provider.WatchlistItemProvider.prototype.removeCallback = function ( target ) {
	const api = new mw.Api();
	if ( !Array.isArray( target ) || target.length <= 50 ) {
		return api.unwatch( target );
	}

	let promise = $.Deferred().resolve( [] ).promise();
	for ( let i = 0; i < target.length; i += 50 ) {
		const batch = target.slice( i, i + 50 );
		promise = promise.then( ( results ) => api.unwatch( batch ).then(
			( removed ) => results.concat( removed )
		) );
	}
	return promise;
};
