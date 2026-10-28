<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Special;

use MediaWiki\Extension\EnhancedStandardUIs\Watchlist\WatchlistItemProviderFactory;
use MediaWiki\Html\Html;
use MediaWiki\Html\TemplateParser;
use MediaWiki\Specials\SpecialEditWatchlist;

/**
 * Enhanced replacement for the normal mode of Special:EditWatchlist.
 */
class EnhancedEditWatchlist extends SpecialEditWatchlist {

	/** @var WatchlistItemProviderFactory */
	private $providerFactory;

	/**
	 * @param WatchlistItemProviderFactory $providerFactory
	 */
	public function __construct( WatchlistItemProviderFactory $providerFactory ) {
		parent::__construct();
		$this->providerFactory = $providerFactory;
	}

	/**
	 * The enhanced view has its own header bar, so suppress the core "For <username>"
	 * subtitle that {@see \MediaWiki\Watchlist\WatchlistSpecialPage::outputSubtitle()} would otherwise add.
	 *
	 * @inheritDoc
	 */
	protected function outputSubtitle(): void {
		// Intentionally left blank.
	}

	/**
	 * @inheritDoc
	 */
	protected function executeViewEditWatchlist() {
		$out = $this->getOutput();
		$out->setPageTitleMsg( $this->msg( 'watchlistedit-normal-title' ) );

		$descriptors = $this->providerFactory->getClientDescriptors( $this );

		$out->addModules( 'ext.enhancedstandarduis.special.watchlist' );
		foreach ( $descriptors as $descriptor ) {
			if ( !empty( $descriptor['module'] ) ) {
				$out->addModules( $descriptor['module'] );
			}
		}

		$out->addModuleStyles( [ 'ext.oojsplus.special.skeleton.styles' ] );
		$templateParser = new TemplateParser( dirname( __DIR__, 2 ) . '/resources/templates' );
		$skeleton = $templateParser->processTemplate( 'watchlist', [
			'searchLabel' => $this->msg( 'enhanced-standard-uis-watchlist-search-label' )->text()
		] );

		$html = Html::rawElement( 'div', [ 'id' => 'enhanced-ui-watchlist-cnt' ],
			Html::rawElement( 'div', [
				'id' => 'enhanced-ui-watchlist-panel',
				'aria-busy' => 'true'
			], $skeleton )
		);
		$out->addHTML( $html );
	}
}
