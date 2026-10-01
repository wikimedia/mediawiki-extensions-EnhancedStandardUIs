<?php

use MediaWiki\Extension\EnhancedStandardUIs\HistoryPluginFactory;
use MediaWiki\Extension\EnhancedStandardUIs\RevisionVisibility;
use MediaWiki\Extension\EnhancedStandardUIs\Watchlist\WatchlistItemProviderFactory;
use MediaWiki\MediaWikiServices;

return [
	'EnhancedStandardUIs.WatchlistItemProviderFactory' => static function ( MediaWikiServices $services ) {
		return new WatchlistItemProviderFactory(
			$services->getObjectFactory()
		);
	},
	'EnhancedStandardUIs.HistoryPluginFactory' => static function ( MediaWikiServices $services ) {
		return new HistoryPluginFactory(
			$services->getObjectFactory()
		);
	},
	'EnhancedStandardUIs.RevisionVisibility' => static function ( MediaWikiServices $services ) {
		return new RevisionVisibility(
			$services->getMainConfig(),
			$services->getRevisionLookup(),
			$services->getService( 'EnhancedStandardUIs.HistoryPluginFactory' )
		);
	}
];
