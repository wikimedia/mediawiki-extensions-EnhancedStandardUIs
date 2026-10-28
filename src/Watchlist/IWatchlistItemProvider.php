<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Watchlist;

use MediaWiki\Language\MessageLocalizer;
use MediaWiki\User\User;

interface IWatchlistItemProvider {

	/**
	 * @return string
	 */
	public function getKey(): string;

	/**
	 * @param MessageLocalizer $localizer Used instead of the global request context, since
	 *   this is also called from a ResourceLoader `packageFiles` callback where sessions
	 *   (and therefore the global user/language) are unavailable.
	 * @return string
	 */
	public function getTabTitle( MessageLocalizer $localizer ): string;

	/**
	 * @return string
	 */
	public function getTabIcon(): string;

	/**
	 * Where the user can start watching items of this type, linked from the hint shown
	 * when the tab is empty
	 *
	 * @return string|null Local URL, or null to show no hint
	 */
	public function getAddItemsUrl(): ?string;

	/**
	 * @param User $user
	 * @return array
	 */
	public function getItems( User $user ): array;
}
