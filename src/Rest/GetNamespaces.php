<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Rest;

use MediaWiki\Context\RequestContext;
use MediaWiki\Languages\LanguageFactory;
use MediaWiki\Permissions\PermissionManager;
use MediaWiki\Rest\SimpleHandler;
use MediaWiki\Title\NamespaceInfo;
use MediaWiki\Title\TitleFactory;
use MediaWiki\Watchlist\WatchedItemStoreInterface;
use Wikimedia\Rdbms\LoadBalancer;

class GetNamespaces extends SimpleHandler {

	/**
	 * Pseudo title used to watch a whole namespace. Watching the page
	 * `<Namespace>:--*--` makes the user watch every page in that namespace.
	 */
	private const NAMESPACE_WATCH_TITLE = '--*--';

	private TitleFactory $titleFactory;
	private PermissionManager $permissionManager;
	private LoadBalancer $loadBalancer;
	private NamespaceInfo $namespaceInfo;
	private LanguageFactory $languageFactory;
	private WatchedItemStoreInterface $watchedItemStore;

	/**
	 *
	 * @param TitleFactory $titleFactory
	 * @param PermissionManager $permissionManager
	 * @param LoadBalancer $loadBalancer
	 * @param NamespaceInfo $namespaceInfo
	 * @param LanguageFactory $languageFactory
	 * @param WatchedItemStoreInterface $watchedItemStore
	 */
	public function __construct( TitleFactory $titleFactory, PermissionManager $permissionManager,
		LoadBalancer $loadBalancer, NamespaceInfo $namespaceInfo, LanguageFactory $languageFactory,
		WatchedItemStoreInterface $watchedItemStore
	) {
		$this->titleFactory = $titleFactory;
		$this->permissionManager = $permissionManager;
		$this->loadBalancer = $loadBalancer;
		$this->namespaceInfo = $namespaceInfo;
		$this->languageFactory = $languageFactory;
		$this->watchedItemStore = $watchedItemStore;
	}

	public function run() {
		$pageCounts = $this->getNamespacePageCount();
		$context = RequestContext::getMain();
		$user = $context->getUser();

		$namespaces = [];
		$langCode = $context->getLanguage();
		$lang = $this->languageFactory->getLanguage( $langCode );

		$readableNamespaces = [];
		foreach ( $lang->getFormattedNamespaces() as $ns => $title ) {
			if ( $ns < 0 ) {
				continue;
			}
			$testTitle = $this->titleFactory->newFromText( 'Enhanced_DummyPage', $ns );
			if ( !$this->permissionManager->userCan( 'read', $user, $testTitle ) ) {
				continue;
			}
			$readableNamespaces[$ns] = $title;
		}

		$watchedNamespaces = $this->getWatchedNamespaces( $user, array_keys( $readableNamespaces ) );

		foreach ( $readableNamespaces as $ns => $title ) {
			$namespaces[] = [
				'id' => $ns,
				'name' => $title,
				'isContent' => $this->namespaceInfo->isContent( $ns ),
				'isTalk' => $this->namespaceInfo->isTalk( $ns ),
				'pageCount' => (int)( $pageCounts[$ns] ?? 0 ),
				'watch' => in_array( $ns, $watchedNamespaces, true )
			];
		}
		usort( $namespaces, static function ( $a, $b ) {
			return $a[ 'name' ] <=> $b[ 'name' ];
		} );

		return $this->getResponseFactory()->createJson( [ 'namespaces' => $namespaces ] );
	}

	/**
	 * Determine which of the given namespaces the user already watches, i.e. has the
	 * pseudo page `<Namespace>:--*--` on their watchlist.
	 *
	 * @param \MediaWiki\User\User $user
	 * @param int[] $namespaceIds
	 * @return int[] Watched namespace ids
	 */
	private function getWatchedNamespaces( $user, array $namespaceIds ): array {
		if ( !$user->isRegistered() || $namespaceIds === [] ) {
			return [];
		}

		$targets = [];
		foreach ( $namespaceIds as $ns ) {
			$targets[] = $this->titleFactory->makeTitle( $ns, self::NAMESPACE_WATCH_TITLE );
		}

		$watchedItems = $this->watchedItemStore->loadWatchedItemsBatch( $user, $targets );
		$watched = [];
		foreach ( $watchedItems as $item ) {
			$target = $item->getTarget();
			if ( $target->getDBkey() === self::NAMESPACE_WATCH_TITLE ) {
				$watched[] = $target->getNamespace();
			}
		}
		return $watched;
	}

	/**
	 * @return array
	 */
	private function getNamespacePageCount() {
		$pageCounts = [];
		$dbr = $this->loadBalancer->getConnection( DB_REPLICA );
		$res = $dbr->select(
			'page',
			[
				'page_namespace',
				'COUNT(*) AS count'
			],
			[
				'page_is_redirect' => 0
			],
			__METHOD__,
			[
				'GROUP BY' => 'page_namespace'
			]
		);
		foreach ( $res as $row ) {
			$pageCounts[(int)$row->page_namespace] = $row->count;
		}
		return $pageCounts;
	}
}
