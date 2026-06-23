<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Watchlist\Provider;

use MediaWiki\Extension\EnhancedStandardUIs\Watchlist\GenericWatchlistItemProvider;
use MediaWiki\Page\PageStore;
use MediaWiki\Title\NamespaceInfo;
use MediaWiki\Title\TitleFactory;
use MediaWiki\User\User;
use MediaWiki\Watchlist\WatchedItemStoreInterface;
use MessageLocalizer;

class NamespaceProvider extends GenericWatchlistItemProvider {

	/** @var PageStore */
	private $pageStore;

	/**
	 * @param WatchedItemStoreInterface $watchedItemStore
	 * @param TitleFactory $titleFactory
	 * @param NamespaceInfo $namespaceInfo
	 * @param PageStore $pageStore
	 */
	public function __construct(
		WatchedItemStoreInterface $watchedItemStore,
		TitleFactory $titleFactory,
		NamespaceInfo $namespaceInfo,
		PageStore $pageStore
	) {
		parent::__construct( $watchedItemStore, $titleFactory, $namespaceInfo );
		$this->pageStore = $pageStore;
	}

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
		return 'references';
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

		$sections = [];
		foreach ( array_keys( $namespaces ) as $ns ) {
			$markerTitle = $this->titleFactory->makeTitleSafe( $ns, self::NAMESPACE_WATCH_MARKER );
			if ( !$markerTitle ) {
				continue;
			}

			$items = [];
			foreach ( $this->getNamespacePages( $ns ) as $page ) {
				$items[] = [
					'label' => $page->getText(),
					'url' => $page->getLocalURL(),
					'exists' => true
				];
			}

			$sections[] = [
				'section' => $this->getSectionLabel( $ns ),
				'target' => $markerTitle->getPrefixedText(),
				'items' => $items
			];
		}

		usort( $sections, static function ( $a, $b ) {
			return strcasecmp( $a['section'], $b['section'] );
		} );

		return $sections;
	}

	/**
	 * The pages that currently exist in a watched namespace, for display under its heading.
	 *
	 * @param int $namespace
	 * @return \MediaWiki\Title\Title[]
	 */
	private function getNamespacePages( int $namespace ): array {
		$records = $this->pageStore->newSelectQueryBuilder()
			->whereNamespace( $namespace )
			->orderByTitle()
			->caller( __METHOD__ )
			->fetchPageRecords();

		$titles = [];
		foreach ( $records as $record ) {
			$title = $this->titleFactory->newFromPageIdentity( $record );
			if ( $title ) {
				$titles[] = $title;
			}
		}
		return $titles;
	}
}
