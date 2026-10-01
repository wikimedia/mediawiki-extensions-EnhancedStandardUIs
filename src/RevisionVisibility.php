<?php

namespace MediaWiki\Extension\EnhancedStandardUIs;

use DateTime;
use MediaWiki\Config\Config;
use MediaWiki\Page\PageIdentity;
use MediaWiki\Permissions\Authority;
use MediaWiki\Revision\RevisionLookup;
use MediaWiki\Revision\RevisionRecord;
use MWTimestamp;

/**
 * Determines which revisions of a page may still be accessed, based on
 * $wgEnhancedUIsHistoryMaxAgeMonths.
 */
class RevisionVisibility {

	public const RIGHT = 'viewoldrevisions';

	/** @var Config */
	private $config;

	/** @var RevisionLookup */
	private $revisionLookup;

	/** @var HistoryPluginFactory */
	private $pluginFactory;

	/**
	 * @param Config $config
	 * @param RevisionLookup $revisionLookup
	 * @param HistoryPluginFactory $pluginFactory
	 */
	public function __construct(
		Config $config, RevisionLookup $revisionLookup, HistoryPluginFactory $pluginFactory
	) {
		$this->config = $config;
		$this->revisionLookup = $revisionLookup;
		$this->pluginFactory = $pluginFactory;
	}

	/**
	 * Revisions created before the returned timestamp must not be shown or accessed.
	 *
	 * @param PageIdentity $page
	 * @param Authority $user
	 * @return string|null Timestamp in TS_MW format, or null if there is no restriction
	 */
	public function getCutoffTimestamp( PageIdentity $page, Authority $user ): ?string {
		$months = (int)$this->config->get( 'EnhancedUIsHistoryMaxAgeMonths' );
		if ( $months < 1 ) {
			return null;
		}
		if ( $user->isAllowed( static::RIGHT ) ) {
			return null;
		}

		$date = new DateTime();
		$date->modify( "-$months months" );
		$cutoff = MWTimestamp::convert( TS_MW, $date->getTimestamp() );

		foreach ( $this->pluginFactory->getPlugins() as $plugin ) {
			if ( !( $plugin instanceof IRevisionAgeExemption ) ) {
				continue;
			}
			$exempt = $plugin->getExemptFromTimestamp( $page, $user );
			if ( $exempt && $exempt < $cutoff ) {
				$cutoff = $exempt;
			}
		}

		return $cutoff;
	}

	/**
	 * @param RevisionRecord $revision
	 * @param Authority $user
	 * @return bool
	 */
	public function isRevisionVisible( RevisionRecord $revision, Authority $user ): bool {
		$page = $revision->getPage();
		$cutoff = $this->getCutoffTimestamp( $page, $user );
		if ( $cutoff === null ) {
			return true;
		}
		if ( $revision->getId() === $this->getLatestRevisionId( $page ) ) {
			return true;
		}

		return $revision->getTimestamp() >= $cutoff;
	}

	/**
	 * @param int $revisionId
	 * @param Authority $user
	 * @return bool
	 */
	public function isRevisionIdVisible( int $revisionId, Authority $user ): bool {
		$revision = $this->revisionLookup->getRevisionById( $revisionId );
		return $revision === null || $this->isRevisionVisible( $revision, $user );
	}

	/**
	 * @param PageIdentity $page
	 * @return int|null
	 */
	public function getLatestRevisionId( PageIdentity $page ): ?int {
		$latest = $this->revisionLookup->getKnownCurrentRevision( $page );
		return $latest === false ? null : (int)$latest;
	}
}
