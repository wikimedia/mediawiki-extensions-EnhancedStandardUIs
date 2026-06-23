<?php

use MediaWiki\Extension\EnhancedStandardUIs\Watchlist\WatchlistItemProviderFactory;
use MediaWiki\MediaWikiServices;

return [
	'EnhancedStandardUIs.WatchlistItemProviderFactory' => static function ( MediaWikiServices $services ) {
		return new WatchlistItemProviderFactory(
			$services->getObjectFactory()
		);
	}
];
