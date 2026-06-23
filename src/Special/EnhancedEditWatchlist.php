<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Special;

use MediaWiki\Extension\EnhancedStandardUIs\Watchlist\WatchlistItemProviderFactory;
use MediaWiki\Html\Html;
use MediaWiki\SpecialPage\SpecialPage;
use MediaWiki\Specials\SpecialEditWatchlist;
use OOUI\FieldLayout;
use OOUI\SearchInputWidget;

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
	 * @inheritDoc
	 */
	protected function executeViewEditWatchlist() {
		$out = $this->getOutput();
		$out->setPageTitleMsg( $this->msg( 'watchlistedit-normal-title' ) );
		$out->enableOOUI();

		$descriptors = $this->providerFactory->getClientDescriptors( $this );

		$out->addModules( 'ext.enhancedstandarduis.special.watchlist' );
		foreach ( $descriptors as $descriptor ) {
			if ( !empty( $descriptor['module'] ) ) {
				$out->addModules( $descriptor['module'] );
			}
		}

		$html = Html::openElement( 'div', [ 'id' => 'enhanced-ui-watchlist-cnt' ] );
		$html .= $this->getHeaderBar();
		$html .= $this->getSearchWidget();
		$html .= Html::element( 'div', [ 'id' => 'enhanced-ui-watchlist-panel' ] );
		$html .= Html::closeElement( 'div' );
		$out->addHTML( $html );
	}

	/**
	 * "View changes on watchlist" link shown above the tabs.
	 *
	 * @return string
	 */
	private function getHeaderBar(): string {
		$bar = Html::openElement( 'div', [ 'class' => 'enhanced-ui-watchlist-header' ] );
		$bar .= Html::element(
			'a',
			[
				'href' => SpecialPage::getTitleFor( 'Watchlist' )->getLocalURL(),
				'class' => 'enhanced-ui-watchlist-view-changes'
			],
			$this->msg( 'enhanced-standard-uis-watchlist-view-changes' )->text()
		);
		$bar .= Html::closeElement( 'div' );
		return $bar;
	}

	/**
	 * @return string
	 */
	private function getSearchWidget(): string {
		$searchInput = new SearchInputWidget( [
			'infusable' => true,
			'id' => 'enhanced-ui-watchlist-filter',
			'icon' => 'search'
		] );
		$search = Html::openElement( 'div', [ 'class' => 'enhanced-ui-watchlist-filter-cnt' ] );
		$search .= new FieldLayout( $searchInput, [
			'label' => $this->msg( 'enhanced-standard-uis-watchlist-search-label' )->text(),
			'align' => 'top'
		] );
		$search .= Html::closeElement( 'div' );
		return $search;
	}
}
