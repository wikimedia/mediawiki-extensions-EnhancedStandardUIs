<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Watchlist;

use MediaWiki\Config\Config;
use MediaWiki\MediaWikiServices;
use MediaWiki\ResourceLoader\Context as ResourceLoaderContext;
use MessageLocalizer;
use MWStake\MediaWiki\Component\ManifestRegistry\ManifestAttributeBasedRegistry;
use Wikimedia\ObjectFactory\ObjectFactory;

/**
 * Builds {@see IWatchlistItemProvider}s from the `EnhancedStandardUIs` attribute
 * `WatchlistItemProviders`. Each registration is an ObjectFactory spec, e.g.:
 *
 *   "pages": {
 *     "class": "...\\Provider\\PageProvider",
 *     "services": [ "WatchedItemStore", "TitleFactory", "NamespaceInfo" ],
 *     "module": "ext.enhancedstandarduis.watchlist.providers",   // optional JS module
 *     "providerClass": "ext.enhancedUI.watchlist.provider.Page"  // optional JS class
 *   }
 */
class WatchlistItemProviderFactory {

	public const ATTRIBUTE = 'EnhancedStandardUIsWatchlistItemProviders';

	/** @var ObjectFactory */
	private $objectFactory;

	/** @var ManifestAttributeBasedRegistry|null */
	private $registry = null;

	/**
	 * @param ObjectFactory $objectFactory
	 */
	public function __construct( ObjectFactory $objectFactory ) {
		$this->objectFactory = $objectFactory;
	}

	/**
	 * @return ManifestAttributeBasedRegistry
	 */
	private function getRegistry(): ManifestAttributeBasedRegistry {
		if ( $this->registry === null ) {
			$this->registry = new ManifestAttributeBasedRegistry( self::ATTRIBUTE );
		}
		return $this->registry;
	}

	/**
	 * @return string[] Registered provider keys, in registration order
	 */
	public function getKeys(): array {
		return $this->getRegistry()->getAllKeys();
	}

	/**
	 * @param string $key
	 * @return IWatchlistItemProvider|null
	 */
	public function getProvider( string $key ): ?IWatchlistItemProvider {
		$spec = $this->getRegistry()->getObjectSpec( $key );
		if ( !$spec || !isset( $spec['class'] ) ) {
			return null;
		}
		unset( $spec['module'], $spec['providerClass'], $spec['position'] );

		$provider = $this->objectFactory->createObject( $spec );
		if ( !( $provider instanceof IWatchlistItemProvider ) ) {
			return null;
		}
		return $provider;
	}

	/**
	 * Client-side descriptors (key, title, icon, optional JS module/class) used to build
	 * the tabs in the browser. Exposed to JS via JsConfigVars.
	 *
	 * Tabs appear in registration order, except that a registration may declare an integer
	 * `position` to override it (lower comes first, default 0). This lets a provider such as
	 * the catch-all Namespaces tab sort after providers contributed by other extensions
	 * (e.g. the "Books" tab from BlueSpiceBookshelf), regardless of extension load order.
	 *
	 * @param MessageLocalizer $localizer Used to resolve tab titles. Must not depend on the
	 *   global request context: this is also called from a ResourceLoader `packageFiles`
	 *   callback, where sessions (and therefore the global user/language) are unavailable.
	 * @return array
	 */
	public function getClientDescriptors( MessageLocalizer $localizer ): array {
		$descriptors = [];
		foreach ( $this->getKeys() as $key ) {
			$spec = $this->getRegistry()->getObjectSpec( $key );
			$provider = $this->getProvider( $key );
			if ( !$provider ) {
				continue;
			}
			$descriptors[] = [
				'key' => $provider->getKey(),
				'title' => $provider->getTabTitle( $localizer ),
				'icon' => $provider->getTabIcon(),
				'module' => $spec['module'] ?? null,
				'providerClass' => $spec['providerClass'] ?? null,
				'position' => (int)( $spec['position'] ?? 0 )
			];
		}

		usort( $descriptors, static function ( $a, $b ) {
			return $a['position'] <=> $b['position'];
		} );

		foreach ( $descriptors as &$descriptor ) {
			unset( $descriptor['position'] );
		}
		unset( $descriptor );

		return $descriptors;
	}

	/**
	 * ResourceLoader `packageFiles` callback that generates the virtual config file consumed
	 * by {@see \MediaWiki\Extension\EnhancedStandardUIs\Special\EnhancedEditWatchlist}'s
	 * client-side panel
	 *
	 * @param ResourceLoaderContext $context
	 * @param Config $config
	 * @return array
	 */
	public static function getClientDescriptorsForModule(
		ResourceLoaderContext $context, Config $config
	): array {
		return MediaWikiServices::getInstance()
			->getService( 'EnhancedStandardUIs.WatchlistItemProviderFactory' )
			->getClientDescriptors( $context );
	}

	/**
	 * ResourceLoader `versionCallback` for the `config/providers.json` packageFiles entry.
	 *
	 * {@see self::getClientDescriptorsForModule} instantiates every registered provider
	 * (pulling in DB-backed services like WatchedItemStore), which is too expensive to run
	 * on every page load. Definition summaries (and therefore this callback) are computed
	 * for every module on every page to build the ResourceLoader startup manifest, so this
	 * only reads the raw registration specs, without calling {@see ObjectFactory}.
	 *
	 * @param ResourceLoaderContext $context
	 * @param Config $config
	 * @return array
	 */
	public static function getClientDescriptorsVersion(
		ResourceLoaderContext $context, Config $config
	): array {
		return MediaWikiServices::getInstance()
			->getService( 'EnhancedStandardUIs.WatchlistItemProviderFactory' )
			->getRawSpecs();
	}

	/**
	 * @return array Registered provider keys mapped to their raw ObjectFactory specs
	 */
	public function getRawSpecs(): array {
		$specs = [];
		foreach ( $this->getKeys() as $key ) {
			$specs[$key] = $this->getRegistry()->getObjectSpec( $key );
		}
		return $specs;
	}
}
