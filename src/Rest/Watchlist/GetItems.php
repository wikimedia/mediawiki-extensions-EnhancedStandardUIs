<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Rest\Watchlist;

use MediaWiki\Context\RequestContext;
use MediaWiki\Extension\EnhancedStandardUIs\Watchlist\WatchlistItemProviderFactory;
use MediaWiki\Rest\SimpleHandler;
use Wikimedia\ParamValidator\ParamValidator;

/**
 * GET /standarduis/watchlist/items/{provider}
 *
 * Returns the watched items of the current user for the given provider, grouped into
 * sections.
 */
class GetItems extends SimpleHandler {

	/** @var WatchlistItemProviderFactory */
	private $providerFactory;

	/**
	 * @param WatchlistItemProviderFactory $providerFactory
	 */
	public function __construct( WatchlistItemProviderFactory $providerFactory ) {
		$this->providerFactory = $providerFactory;
	}

	/**
	 * @param string $providerKey
	 * @return \MediaWiki\Rest\Response
	 */
	public function run( $providerKey ) {
		$user = RequestContext::getMain()->getUser();
		if ( !$user->isRegistered() ) {
			return $this->getResponseFactory()->createHttpError( 403, [ 'error' => 'Not logged in' ] );
		}

		$provider = $this->providerFactory->getProvider( $providerKey );
		if ( !$provider ) {
			return $this->getResponseFactory()->createHttpError( 404, [ 'error' => 'Unknown provider' ] );
		}

		return $this->getResponseFactory()->createJson( [
			'sections' => $provider->getItems( $user )
		] );
	}

	/** @inheritDoc */
	public function getParamSettings() {
		return [
			'provider' => [
				self::PARAM_SOURCE => 'path',
				ParamValidator::PARAM_TYPE => 'string',
				ParamValidator::PARAM_REQUIRED => true
			]
		];
	}
}
