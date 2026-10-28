<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Watchlist\Provider;

use MediaWiki\Extension\EnhancedStandardUIs\Watchlist\GenericWatchlistItemProvider;
use MediaWiki\Language\MessageLocalizer;
use MediaWiki\SpecialPage\SpecialPage;

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
		return 'file-earmark';
	}

	/**
	 * @inheritDoc
	 */
	public function getAddItemsUrl(): ?string {
		return SpecialPage::getTitleFor( 'Allpages' )->getLocalURL();
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

	/**
	 * @inheritDoc
	 */
	protected function sectionsCollapsible(): bool {
		return true;
	}
}
