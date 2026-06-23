<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Watchlist;

use MediaWiki\User\User;
use MessageLocalizer;

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
	 * @param User $user
	 * @return array
	 */
	public function getItems( User $user ): array;
}
