<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Rest;

use MediaWiki\Context\RequestContext;
use MediaWiki\Rest\SimpleHandler;
use MediaWiki\Title\NamespaceInfo;
use MediaWiki\Title\TitleFactory;
use MediaWiki\Watchlist\WatchedItemStoreInterface;
use Wikimedia\ParamValidator\ParamValidator;

/**
 * Watch or unwatch a whole namespace.
 *
 * A namespace is watched by storing a single watchlist row whose title is the
 * `<Namespace>:--*--` sentinel. This handler writes that row directly through the
 * {@see WatchedItemStoreInterface}, deliberately bypassing
 * `WatchlistManager::addWatch()`/`removeWatch()`, which would also watch/unwatch the
 * associated talk namespace and therefore create a spurious `<Namespace> talk:--*--`
 * entry.
 */
class WatchNamespace extends SimpleHandler {

	/** Pseudo title used to watch a whole namespace. */
	private const NAMESPACE_WATCH_TITLE = '--*--';

	private TitleFactory $titleFactory;
	private NamespaceInfo $namespaceInfo;
	private WatchedItemStoreInterface $watchedItemStore;

	/**
	 * @param TitleFactory $titleFactory
	 * @param NamespaceInfo $namespaceInfo
	 * @param WatchedItemStoreInterface $watchedItemStore
	 */
	public function __construct(
		TitleFactory $titleFactory,
		NamespaceInfo $namespaceInfo,
		WatchedItemStoreInterface $watchedItemStore
	) {
		$this->titleFactory = $titleFactory;
		$this->namespaceInfo = $namespaceInfo;
		$this->watchedItemStore = $watchedItemStore;
	}

	/**
	 * @return \MediaWiki\Rest\Response
	 */
	public function run() {
		$user = RequestContext::getMain()->getUser();
		if ( !$user->isRegistered() ) {
			return $this->getResponseFactory()->createHttpError(
				403, [ 'Watching namespaces is not available for anonymous users' ] );
		}
		if ( !$user->isAllowed( 'editmywatchlist' ) ) {
			return $this->getResponseFactory()->createHttpError( 403, [ 'Permission denied' ] );
		}

		$body = $this->getValidatedBody();
		$ns = (int)$body['namespaceId'];
		$watch = (bool)$body['watch'];

		if ( !$this->namespaceInfo->exists( $ns ) || !$this->namespaceInfo->isWatchable( $ns ) ) {
			return $this->getResponseFactory()->createHttpError( 400, [ 'Invalid or unwatchable namespace' ] );
		}

		$target = $this->titleFactory->makeTitleSafe( $ns, self::NAMESPACE_WATCH_TITLE );
		if ( !$target ) {
			return $this->getResponseFactory()->createHttpError( 400, [ 'Invalid namespace target' ] );
		}

		if ( $watch ) {
			$this->watchedItemStore->addWatch( $user, $target );
		} else {
			$this->watchedItemStore->removeWatch( $user, $target );
		}

		return $this->getResponseFactory()->createJson( [ 'success' => true, 'watch' => $watch ] );
	}

	/** @inheritDoc */
	public function getBodyParamSettings(): array {
		return [
			'namespaceId' => [
				self::PARAM_SOURCE => 'body',
				ParamValidator::PARAM_TYPE => 'integer',
				ParamValidator::PARAM_REQUIRED => true
			],
			'watch' => [
				self::PARAM_SOURCE => 'body',
				ParamValidator::PARAM_TYPE => 'boolean',
				ParamValidator::PARAM_REQUIRED => true
			]
		];
	}
}
