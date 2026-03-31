<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\HookHandler;

use MediaWiki\Context\RequestContext;
use MediaWiki\Extension\EnhancedStandardUIs\Component\CreatePageActionButton;
use MediaWiki\Extension\EnhancedStandardUIs\Component\UploadFileButton;
use MediaWiki\Extension\EnhancedStandardUIs\FilelistGlobalAction;
use MediaWiki\Permissions\PermissionManager;
use MWStake\MediaWiki\Component\CommonUserInterface\Hook\MWStakeCommonUIRegisterSkinSlotComponents;

class RegisterGlobalActions implements MWStakeCommonUIRegisterSkinSlotComponents {

	/**
	 * @param PermissionManager $permissionManager
	 */
	public function __construct( private readonly PermissionManager $permissionManager ) {
	}

	/**
	 * @inheritDoc
	 */
	public function onMWStakeCommonUIRegisterSkinSlotComponents( $registry ): void {
		$registry->register(
			'GlobalActionsOverview',
			[
				'special-enhanced-standard-uis-filelist' => [
					'factory' => static function () {
						return new FilelistGlobalAction();
					}
				]
			]
		);

		$context = RequestContext::getMain();
		$skin = $context->getSkin();
		$title = $context->getTitle();
		if ( $title && $title->isSpecial( 'EnhancedAllPages' ) &&
			is_a( $skin, 'SkinBlueSpiceEclipseSkin', true ) ) {
			$registry->register(
				'TitleActions',
				[
					'page-action' => [
						'factory' => function () {
							return new CreatePageActionButton( $this->permissionManager );
						}
					]
				]
			);
		}
		if ( $title && $title->isSpecial( 'EnhancedFilelist' ) &&
			is_a( $skin, 'SkinBlueSpiceEclipseSkin', true ) ) {
			$registry->register(
				'TitleActions',
				[
					'upload-file-action' => [
						'factory' => function () {
							return new UploadFileButton( $this->permissionManager );
						}
					]
				]
			);
		}
	}
}
