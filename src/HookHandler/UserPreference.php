<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\HookHandler;

use MediaWiki\Preferences\Hook\GetPreferencesHook;

class UserPreference implements GetPreferencesHook {

	/**
	 *
	 * @inheritDoc
	 */
	public function onGetPreferences( $user, &$preferences ) {
		$api = [ 'type' => 'api' ];
		$preferences[ 'history-show-revision' ] = $api;
		$preferences[ 'history-show-author' ] = $api;
		$preferences[ 'history-show-diff' ] = $api;
		$preferences[ 'history-show-size' ] = $api;
		$preferences[ 'history-show-summary' ] = $api;
		$preferences[ 'history-show-tags' ] = $api;
	}
}
