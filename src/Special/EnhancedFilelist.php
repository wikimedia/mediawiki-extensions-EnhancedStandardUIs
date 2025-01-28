<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Special;

use MediaWiki\Html\Html;
use MediaWiki\SpecialPage\SpecialPage;

class EnhancedFilelist extends SpecialPage {

	/**
	 *
	 * @inheritDoc
	 */
	public function __construct() {
		parent::__construct( 'EnhancedFilelist' );
	}

	/**
	 *
	 * @inheritDoc
	 */
	public function execute( $subPage ) {
		$out = $this->getOutput();

		$this->setHeaders();
		$this->outputHeader();
		$out->getMetadata()->setPreventClickjacking( false );
		$this->setHeaders();
		$out->enableOOUI();

		$out->addModules( [ 'ext.enhancedstandarduis.special.filelist' ] );

		$html = Html::element(
			'div',
			[
				'id' => 'enhanced-ui-filelist-cnt'
			]
		);

		$out->addHTML( $html );
	}

}
