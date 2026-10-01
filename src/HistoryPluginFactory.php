<?php

namespace MediaWiki\Extension\EnhancedStandardUIs;

use InvalidArgumentException;
use MediaWiki\Registration\ExtensionRegistry;
use Wikimedia\ObjectFactory\ObjectFactory;

class HistoryPluginFactory {

	/** @var ObjectFactory */
	private $objectFactory;

	/** @var IHistoryPlugin[]|null */
	private $plugins = null;

	/**
	 * @param ObjectFactory $objectFactory
	 */
	public function __construct( ObjectFactory $objectFactory ) {
		$this->objectFactory = $objectFactory;
	}

	/**
	 * @return IHistoryPlugin[] Keyed by plugin key
	 */
	public function getPlugins(): array {
		if ( $this->plugins !== null ) {
			return $this->plugins;
		}

		$registry = ExtensionRegistry::getInstance()->getAttribute(
			'EnhancedStandardUIsHistoryPagePlugins'
		);

		$this->plugins = [];
		foreach ( $registry as $key => $spec ) {
			$object = $this->objectFactory->createObject( $spec );
			if ( !( $object instanceof IHistoryPlugin ) ) {
				throw new InvalidArgumentException( "Invalid history plugin \"$key\"" );
			}
			$this->plugins[$key] = $object;
		}

		return $this->plugins;
	}
}
