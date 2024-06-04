<?php

// phpcs:disable MediaWiki.NamingConventions.LowerCamelFunctionsName.FunctionName

namespace MediaWiki\Extension\EnhancedStandardUIs\HookHandler;

use Config;
use MediaWiki\Extension\EnhancedStandardUIs\Special\EnhancedAllPages;
use MediaWiki\Extension\EnhancedStandardUIs\Special\EnhancedFilelist;
use MediaWiki\SpecialPage\Hook\SpecialPage_initListHook;

class OverwriteSpecialPages implements SpecialPage_initListHook {

	/** @var Config */
	private $config;

	/**
	 *
	 * @param Config $config
	 */
	public function __construct( Config $config ) {
		$this->config = $config;
	}

	/**
	 *
	 * @inheritDoc
	 */
	public function onSpecialPage_initList( &$list ) {
		if ( $this->config->get( 'EnhancedUIsAllPagesOverride' ) ) {
			$list['Allpages'] = [ 'class' => EnhancedAllPages::class ];
		}

		if ( $this->config->get( 'EnhancedUIsExtendedFilelistOverride' ) ) {
			$list['BlueSpiceExtendedFilelist'] = [ 'class' => EnhancedFilelist::class ];
		}

		return true;
	}
}
