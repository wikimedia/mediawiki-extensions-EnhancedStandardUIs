<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Watchlist\Provider;

use MediaWiki\Extension\EnhancedStandardUIs\Watchlist\GenericWatchlistItemProvider;
use MessageLocalizer;

class PageProvider extends GenericWatchlistItemProvider {

	/**
	 * @inheritDoc
	 */
	public function getKey(): string {
		return 'pages';
	}

	/**
	 * @inheritDoc
	 */
	public function getTabTitle( MessageLocalizer $localizer ): string {
		return $localizer->msg( 'enhanced-standard-uis-watchlist-tab-pages' )->text();
	}

	/**
	 * @inheritDoc
	 */
	public function getTabIcon(): string {
		return 'article';
	}

	/**
	 * @inheritDoc
	 */
	protected function isInScope( int $namespace ): bool {
		if ( $namespace === NS_CATEGORY ) {
			return false;
		}
		if ( defined( 'NS_BOOK' ) && $namespace === NS_BOOK ) {
			return false;
		}
		return true;
	}
}
