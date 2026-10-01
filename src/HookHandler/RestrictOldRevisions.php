<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\HookHandler;

use MediaWiki\Actions\Hook\RawPageViewBeforeOutputHook;
use MediaWiki\Api\ApiQueryRevisions;
use MediaWiki\Api\Hook\ApiQueryBaseBeforeQueryHook;
use MediaWiki\Diff\Hook\DifferenceEngineViewHeaderHook;
use MediaWiki\Extension\EnhancedStandardUIs\RevisionVisibility;
use MediaWiki\Page\Hook\ArticleRevisionViewCustomHook;
use MediaWiki\Permissions\Authority;
use MediaWiki\Revision\RevisionRecord;
use PermissionsError;
use Wikimedia\Rdbms\ILoadBalancer;
use Wikimedia\Rdbms\RawSQLValue;

class RestrictOldRevisions implements
	ApiQueryBaseBeforeQueryHook,
	ArticleRevisionViewCustomHook,
	DifferenceEngineViewHeaderHook,
	RawPageViewBeforeOutputHook
{

	/** @var RevisionVisibility */
	private $revisionVisibility;
	/** @var ILoadBalancer */
	private $loadBalancer;

	/**
	 * @param RevisionVisibility $revisionVisibility
	 * @param ILoadBalancer $loadBalancer
	 */
	public function __construct( RevisionVisibility $revisionVisibility, ILoadBalancer $loadBalancer ) {
		$this->revisionVisibility = $revisionVisibility;
		$this->loadBalancer = $loadBalancer;
	}

	/**
	 * @inheritDoc
	 */
	public function onApiQueryBaseBeforeQuery(
		$module, &$tables, &$fields, &$conds, &$query_options, &$join_conds, &$hookData
	) {
		if ( !( $module instanceof ApiQueryRevisions ) ) {
			return;
		}

		$authority = $module->getAuthority();
		$pageSet = $module->getQuery()->getPageSet();
		$db = $this->loadBalancer->getConnection( DB_REPLICA );
		$pageConditions = [];
		foreach ( $pageSet->getGoodPages() as $pageId => $page ) {
			$cutoff = $this->revisionVisibility->getCutoffTimestamp( $page, $authority );
			if ( $cutoff === null ) {
				$pageConditions[] = $db->andExpr( [ 'rev_page' => $pageId ] );
				continue;
			}

			$pageConditions[] = $db->andExpr( [
				'rev_page' => $pageId,
				$db->orExpr( [
					$db->expr( 'rev_timestamp', '>=', $db->timestamp( $cutoff ) ),
					$db->expr( 'rev_id', '=', new RawSQLValue( 'page_latest' ) ),
				] ),
			] );
		}
		if ( $pageConditions ) {
			$conds[] = $db->orExpr( $pageConditions );
		}

		$hiddenRevisionIds = [];
		foreach ( $pageSet->getLiveRevisionIDs() as $revisionId => $pageId ) {
			if ( !$this->revisionVisibility->isRevisionIdVisible( $revisionId, $authority ) ) {
				$hiddenRevisionIds[] = (int)$revisionId;
			}
		}
		if ( $hiddenRevisionIds ) {
			$conds[] = 'rev_id NOT IN (' . implode( ',', $hiddenRevisionIds ) . ')';
		}
	}

	/**
	 * @inheritDoc
	 */
	public function onArticleRevisionViewCustom( $revision, $title, $oldid, $output ) {
		if ( $oldid && $revision instanceof RevisionRecord ) {
			$this->assertVisible( $revision, $output->getAuthority() );
		}

		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function onDifferenceEngineViewHeader( $differenceEngine ) {
		$user = $differenceEngine->getAuthority();
		$revisions = [ $differenceEngine->getOldRevision(), $differenceEngine->getNewRevision() ];
		foreach ( $revisions as $revision ) {
			if ( $revision instanceof RevisionRecord ) {
				$this->assertVisible( $revision, $user );
			}
		}
	}

	/**
	 * @inheritDoc
	 */
	public function onRawPageViewBeforeOutput( $obj, &$text ) {
		$oldid = $obj->getOldId();
		if ( $oldid > 0
			&& !$this->revisionVisibility->isRevisionIdVisible( $oldid, $obj->getAuthority() )
		) {
			throw new PermissionsError( 'read', [ 'enhanced-standard-uis-error-revision-too-old' ] );
		}

		return true;
	}

	/**
	 * @param RevisionRecord $revision
	 * @param Authority $user
	 * @return void
	 * @throws PermissionsError
	 */
	private function assertVisible( RevisionRecord $revision, Authority $user ) {
		if ( $this->revisionVisibility->isRevisionVisible( $revision, $user ) ) {
			return;
		}
		throw new PermissionsError( 'read', [ 'enhanced-standard-uis-error-revision-too-old' ] );
	}
}
