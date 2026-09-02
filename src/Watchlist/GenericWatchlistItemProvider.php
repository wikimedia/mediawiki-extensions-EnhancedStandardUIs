<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Watchlist;

use MediaWiki\Context\RequestContext;
use MediaWiki\Title\NamespaceInfo;
use MediaWiki\Title\Title;
use MediaWiki\Title\TitleFactory;
use MediaWiki\User\User;
use MediaWiki\Watchlist\WatchedItemStoreInterface;

/**
 * Base provider that reads the watched items from the standard `watchlist` services and
 * groups them by namespace. Concrete providers only need to declare which namespaces
 * belong to their tab (see {@see self::isInScope()}) and the tab metadata.
 *
 * Removal is handled client-side via the standard MediaWiki unwatch API, so this class
 * only deals with reads.
 */
abstract class GenericWatchlistItemProvider implements IWatchlistItemProvider {

	/**
	 * Sentinel DB key that marks a whole namespace as watched. A watchlist row with this
	 * title in namespace X means "namespace X is watched" rather than "the page
	 * X:--*-- is watched".
	 *
	 * @see \MediaWiki\Extension\EnhancedStandardUIs\Watchlist\Provider\NamespaceProvider
	 */
	public const NAMESPACE_WATCH_MARKER = '--*--';

	/** @var WatchedItemStoreInterface */
	protected $watchedItemStore;

	/** @var TitleFactory */
	protected $titleFactory;

	/** @var NamespaceInfo */
	protected $namespaceInfo;

	/**
	 * @param WatchedItemStoreInterface $watchedItemStore
	 * @param TitleFactory $titleFactory
	 * @param NamespaceInfo $namespaceInfo
	 */
	public function __construct(
		WatchedItemStoreInterface $watchedItemStore,
		TitleFactory $titleFactory,
		NamespaceInfo $namespaceInfo
	) {
		$this->watchedItemStore = $watchedItemStore;
		$this->titleFactory = $titleFactory;
		$this->namespaceInfo = $namespaceInfo;
	}

	/**
	 * Whether a watched title's namespace belongs to this provider's tab.
	 *
	 * @param int $namespace
	 * @return bool
	 */
	abstract protected function isInScope( int $namespace ): bool;

	/**
	 * @inheritDoc
	 */
	public function getItems( User $user ): array {
		$titles = $this->getScopedTitles( $user );

		$grouped = [];
		foreach ( $titles as $title ) {
			$ns = $title->getNamespace();
			if ( !isset( $grouped[$ns] ) ) {
				$grouped[$ns] = [];
			}
			$grouped[$ns][] = $this->titleToItem( $title );
		}

		ksort( $grouped );

		$sections = [];
		foreach ( $grouped as $ns => $items ) {
			usort( $items, static function ( $a, $b ) {
				return strcasecmp( $a['label'], $b['label'] );
			} );
			$sections[] = [
				'section' => $this->getSectionLabel( $ns ),
				'collapsible' => $this->sectionsCollapsible(),
				'items' => $items
			];
		}

		return $sections;
	}

	/**
	 * Whether the client should render an expander before each namespace heading so the
	 * section can be collapsed. Off by default; providers that produce many namespace
	 * sections (see {@see \MediaWiki\Extension\EnhancedStandardUIs\Watchlist\Provider\PageProvider})
	 * enable it.
	 *
	 * @return bool
	 */
	protected function sectionsCollapsible(): bool {
		return false;
	}

	/**
	 * The client-side item row for a single watched title.
	 *
	 * @param Title $title
	 * @return array
	 */
	protected function titleToItem( Title $title ): array {
		return [
			'prefixedText' => $title->getPrefixedText(),
			'label' => $title->getText(),
			'url' => $title->getLocalURL(),
			'exists' => $title->isKnown()
		];
	}

	/**
	 * Wrap a flat list of item rows as a single head-less section, sorted by label.
	 * Returns an empty result (no section) when there is nothing to show.
	 *
	 * @param array[] $items
	 * @return array
	 */
	protected function singleFlatSection( array $items ): array {
		usort( $items, static function ( $a, $b ) {
			return strcasecmp( $a['label'], $b['label'] );
		} );

		return $items ? [ [ 'items' => $items ] ] : [];
	}

	/**
	 * The watched titles of this user that fall into this provider's scope (no talk pages).
	 *
	 * @param User $user
	 * @return Title[]
	 */
	protected function getScopedTitles( User $user ): array {
		$watchedItems = $this->watchedItemStore->getWatchedItemsForUser( $user );

		$titles = [];
		foreach ( $watchedItems as $watchedItem ) {
			$target = $watchedItem->getTarget();
			$ns = $target->getNamespace();
			if ( $ns < 0 || $this->namespaceInfo->isTalk( $ns ) ) {
				continue;
			}
			if ( $target->getDBkey() === self::NAMESPACE_WATCH_MARKER ) {
				continue;
			}
			if ( !$this->isInScope( $ns ) ) {
				continue;
			}
			$title = $this->titleFactory->makeTitleSafe( $ns, $target->getDBkey() );
			if ( $title ) {
				$titles[] = $title;
			}
		}

		return $titles;
	}

	/**
	 * Heading for a namespace section.
	 *
	 * @param int $namespace
	 * @return string
	 */
	protected function getSectionLabel( int $namespace ): string {
		$lang = RequestContext::getMain()->getLanguage();
		$text = $lang->getFormattedNsText( $namespace );
		if ( $text === '' ) {
			return RequestContext::getMain()->msg(
				'enhanced-standard-uis-watchlist-main-namespace-label'
			)->text();
		}
		return $text;
	}
}
