<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Watchlist\Provider;

use MediaWiki\Extension\EnhancedStandardUIs\Watchlist\GenericWatchlistItemProvider;
use MediaWiki\SpecialPage\SpecialPage;
use MediaWiki\User\User;
use MessageLocalizer;

class NamespaceProvider extends GenericWatchlistItemProvider {

	/**
	 * @inheritDoc
	 */
	public function getKey(): string {
		return 'namespaces';
	}

	/**
	 * @inheritDoc
	 */
	public function getTabTitle( MessageLocalizer $localizer ): string {
		return $localizer->msg( 'enhanced-standard-uis-watchlist-tab-namespaces' )->text();
	}

	/**
	 * @inheritDoc
	 */
	public function getTabIcon(): string {
		return 'namespaces';
	}

	/**
	 * This provider reads the marker rows directly (see {@see self::getItems()});
	 *
	 * @inheritDoc
	 */
	protected function isInScope( int $namespace ): bool {
		return false;
	}

	/**
	 * A single, un-grouped list of the watched namespaces. Each link points at
	 * Special:AllPages pre-filtered to that namespace.
	 *
	 * @inheritDoc
	 */
	public function getItems( User $user ): array {
		$watchedItems = $this->watchedItemStore->getWatchedItemsForUser( $user );

		$namespaces = [];
		foreach ( $watchedItems as $watchedItem ) {
			$target = $watchedItem->getTarget();
			if ( $target->getDBkey() !== self::NAMESPACE_WATCH_MARKER ) {
				continue;
			}
			$ns = $target->getNamespace();
			if ( $ns < 0 ) {
				continue;
			}
			$namespaces[$ns] = true;
		}

		$allPages = SpecialPage::getTitleFor( 'Allpages' );

		$items = [];
		foreach ( array_keys( $namespaces ) as $ns ) {
			$markerTitle = $this->titleFactory->makeTitleSafe( $ns, self::NAMESPACE_WATCH_MARKER );
			if ( !$markerTitle ) {
				continue;
			}
			$items[] = [
				'prefixedText' => $markerTitle->getPrefixedText(),
				'label' => $this->getSectionLabel( $ns ),
				'url' => $allPages->getLocalURL( [ 'namespace' => $ns ] ),
				'exists' => true
			];
		}

		return $this->singleFlatSection( $items );
	}
}
