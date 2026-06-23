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
 * @param {Object} cfg key, title, icon
 */
ext.enhancedUI.watchlist.provider.WatchlistItemProvider = function ( cfg ) {
	cfg = cfg || {};
	this.key = cfg.key;
	this.title = cfg.title;
	this.icon = cfg.icon;
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
 * @return {jQuery.Promise} Resolves with { sections: [ { section, items } ] }
 */
ext.enhancedUI.watchlist.provider.WatchlistItemProvider.prototype.getItems = function () {
	return this.api.getWatchlistItems( this.key );
};

/**
 * Remove one or more items from the watchlist. Uses the standard MediaWiki unwatch API,
 * which writes to the `watchlist` table (and handles the CSRF token). Override for
 * provider-specific behaviour
 *
 * @param {string|string[]} target Prefixed title, or array of titles
 * @return {jQuery.Promise}
 */
ext.enhancedUI.watchlist.provider.WatchlistItemProvider.prototype.removeCallback = function ( target ) {
	return new mw.Api().unwatch( target );
};
