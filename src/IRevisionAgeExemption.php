<?php

namespace MediaWiki\Extension\EnhancedStandardUIs;

use MediaWiki\Page\PageIdentity;
use MediaWiki\Permissions\Authority;

/**
 * May be implemented in addition to IHistoryPlugin to keep revisions visible
 * that would otherwise be hidden by $wgEnhancedUIsHistoryMaxAgeMonths.
 */
interface IRevisionAgeExemption {

	/**
	 * All revisions of $page created at or after the returned timestamp stay visible,
	 * even if they are older than the configured maximum revision age.
	 *
	 * @param PageIdentity $page
	 * @param Authority $user
	 * @return string|null Timestamp in TS_MW format, or null if nothing is exempt
	 */
	public function getExemptFromTimestamp( PageIdentity $page, Authority $user ): ?string;
}
