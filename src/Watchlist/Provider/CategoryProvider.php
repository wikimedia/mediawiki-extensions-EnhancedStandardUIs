<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Watchlist\Provider;

use MediaWiki\Extension\EnhancedStandardUIs\Watchlist\GenericWatchlistItemProvider;
use MediaWiki\User\User;
use MessageLocalizer;

class CategoryProvider extends GenericWatchlistItemProvider {

	/**
	 * @inheritDoc
	 */
	public function getKey(): string {
		return 'categories';
	}

	/**
	 * @inheritDoc
	 */
	public function getTabTitle( MessageLocalizer $localizer ): string {
		return $localizer->msg( 'enhanced-standard-uis-watchlist-tab-categories' )->text();
	}

	/**
	 * @inheritDoc
	 */
	public function getTabIcon(): string {
		return 'tag';
	}

	/**
	 * @inheritDoc
	 */
	protected function isInScope( int $namespace ): bool {
		return $namespace === NS_CATEGORY;
	}

	/**
	 * A single, un-grouped list of the watched category pages. Each link points at the
	 * category page itself.
	 *
	 * @inheritDoc
	 */
	public function getItems( User $user ): array {
		$items = [];
		foreach ( $this->getScopedTitles( $user ) as $categoryTitle ) {
			$items[] = $this->titleToItem( $categoryTitle );
		}

		return $this->singleFlatSection( $items );
	}
}
