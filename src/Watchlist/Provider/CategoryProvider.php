<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Watchlist\Provider;

use MediaWiki\Category\Category;
use MediaWiki\Extension\EnhancedStandardUIs\Watchlist\GenericWatchlistItemProvider;
use MediaWiki\User\User;
use MessageLocalizer;

class CategoryProvider extends GenericWatchlistItemProvider {

	/**
	 * @inheritDoc
	 */
	public function getKey(): string {
		return 'categories';
	}

	/**
	 * @inheritDoc
	 */
	public function getTabTitle( MessageLocalizer $localizer ): string {
		return $localizer->msg( 'enhanced-standard-uis-watchlist-tab-categories' )->text();
	}

	/**
	 * @inheritDoc
	 */
	public function getTabIcon(): string {
		return 'tag';
	}

	/**
	 * @inheritDoc
	 */
	protected function isInScope( int $namespace ): bool {
		return $namespace === NS_CATEGORY;
	}

	/**
	 * @inheritDoc
	 */
	public function getItems( User $user ): array {
		$categories = $this->getScopedTitles( $user );
		usort( $categories, static function ( $a, $b ) {
			return strcasecmp( $a->getText(), $b->getText() );
		} );

		$sections = [];
		foreach ( $categories as $categoryTitle ) {
			$category = Category::newFromTitle( $categoryTitle );

			$items = [];
			foreach ( $category->getMembers() as $member ) {
				$items[] = [
					'label' => $member->getPrefixedText(),
					'url' => $member->getLocalURL(),
					'exists' => $member->isKnown()
				];
			}

			$sections[] = [
				'section' => $categoryTitle->getText(),
				'target' => $categoryTitle->getPrefixedText(),
				'items' => $items
			];
		}

		return $sections;
	}
}
