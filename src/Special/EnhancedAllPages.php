<?php

namespace Mediawiki\Extension\EnhancedStandardUIs\Special;

use ExtensionRegistry;
use Html;
use OOUI\FieldLayout;
use OOUI\SearchInputWidget;
use SpecialPage;

class EnhancedAllPages extends SpecialPage {

	public function __construct() {
		parent::__construct( 'EnhancedAllPages' );
	}

	/**
	 *
	 * @inheritDoc
	 */
	public function execute( $subPage ) {
		$out = $this->getOutput();

		$this->setHeaders();
		$this->outputHeader();
		$out->setPreventClickjacking( false );
		$this->setHeaders();
		$out->enableOOUI();

		$out->addModules( [ 'ext.enhancedstandarduis.special.allpages' ] );
		$modules = ExtensionRegistry::getInstance()->getAttribute(
			'EnhancedStandardUIsAllPagesPluginModules'
		);
		$out->addModules( $modules );

		$html = Html::openElement(
			'div',
			[
				'id' => 'enhanced-ui-allpages-cnt'
			]
		);
		$html .= $this->getSearchWidget();
		$html .= Html::closeElement( 'div' );
		$out->addHTML( $html );
	}

	/**
	 *
	 * @return string
	 */
	private function getSearchWidget() {
		$searchInput = new SearchInputWidget( [
			'infusable' => true,
			'id' => 'enhanced-ui-allpages-filter',
			'icon' => 'search'
		] );
		$search = Html::openElement( 'div', [
			'class' => 'allpages-filter-cnt'
		] );
		$search .= new FieldLayout( $searchInput, [
			'label' => 'Filter pages'
		] );
		$search .= Html::closeElement( 'div' );

		return $search;
	}
}
