<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Watchlist\Provider;

use MediaWiki\Extension\EnhancedStandardUIs\Watchlist\GenericWatchlistItemProvider;
use MediaWiki\Language\MessageLocalizer;
use MediaWiki\SpecialPage\SpecialPage;
use MediaWiki\User\User;

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
	public function getAddItemsUrl(): ?string {
		return SpecialPage::getTitleFor( 'Allpages' )->getLocalURL( [ 'namespace' => NS_CATEGORY ] );
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
