<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Component;

use MediaWiki\Context\IContextSource;
use MediaWiki\Message\Message;
use MediaWiki\Permissions\PermissionManager;
use MWStake\MediaWiki\Component\CommonUserInterface\Component\SimpleLink;

class CreatePageActionButton extends SimpleLink {

	/**
	 * @param PermissionManager $permissionManager
	 */
	public function __construct( private readonly PermissionManager $permissionManager ) {
		return parent::__construct( [] );
	}

	/**
	 * @inheritDoc
	 */
	public function getId(): string {
		return 'create-page-btn';
	}

	/**
	 * @inheritDoc
	 */
	public function getSubComponents(): array {
		return [];
	}

	/**
	 * @inheritDoc
	 */
	public function getClasses(): array {
		return [ 'ca-new-page', 'ico-btn', 'bi-bs-create-page' ];
	}

	/**
	 * @inheritDoc
	 */
	public function getRole(): string {
		return 'button';
	}

	/**
	 * @inheritDoc
	 */
	public function getTitle(): Message {
		return Message::newFromKey( 'enhanced-standard-uis-allpages-create-new-page-title' );
	}

	/**
	 * @inheritDoc
	 */
	public function getAriaLabel(): Message {
		return Message::newFromKey( 'enhanced-standard-uis-allpages-create-new-page-aria-label' );
	}

	/**
	 * @inheritDoc
	 */
	public function getHref(): string {
		return '';
	}

	/**
	 * @inheritDoc
	 */
	public function shouldRender( IContextSource $context ): bool {
		$user = $context->getUser();
		$userCan = $this->permissionManager->userHasRight( $user, 'createpage' );
		if ( $userCan ) {
			return true;
		}
		return false;
	}
}
