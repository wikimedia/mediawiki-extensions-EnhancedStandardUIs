<?php

namespace MediaWiki\Extension\EnhancedStandardUIs\Special;

use Closure;
use DateTime;
use DateTimeZone;
use MediaWiki\Config\Config;
use MediaWiki\Html\Html;
use MediaWiki\MainConfigNames;
use MediaWiki\Message\Message;
use MediaWiki\Message\MessageFormatterFactory;
use MediaWiki\Preferences\PreferencesFactory;
use MediaWiki\User\UserTimeCorrection;
use MediaWiki\Utils\MWTimestamp;
use OOJSPlus\Special\OOJSBookletSpecialPage;
use OOUI\FieldLayout;
use Wikimedia\Message\MessageValue;
use Wikimedia\Message\ScalarParam;

/**
 * Override the default Special:Preferences page
 */
class EnhancedPreferences extends OOJSBookletSpecialPage {

	/** @var PreferencesFactory */
	private $preferencesFactory;

	/** @var Config */
	private $config;

	/** @var ITextFormatter */
	private $msgFormatter;

	/**
	 * @param PreferencesFactory $preferencesFactory
	 * @param Config $config
	 * @param MessageFormatterFactory $msgFormatterFactory
	 */
	public function __construct( PreferencesFactory $preferencesFactory, Config $config,
		MessageFormatterFactory $msgFormatterFactory ) {
		$this->preferencesFactory = $preferencesFactory;
		$this->config = $config;
		parent::__construct( 'EnhancedPreferences' );
		$langCode = $this->getLanguage()->getCode();
		$this->msgFormatter = $msgFormatterFactory->getTextFormatter( $langCode );
	}

	/**
	 * @inheritDoc
	 */
	public function doExecute( $par ) {
		$this->setHeaders();
		$this->outputHeader();
		$out = $this->getOutput();

		// Prevent hijacked user scripts from sniffing passwords etc.
		$out->disallowUserJs();

		$this->requireNamedUser( 'prefsnologintext2' );
		$this->checkReadOnly();
		$user = $this->getUser();
		$preferences = $this->preferencesFactory->getFormDescriptor( $user, $this->getContext() );

		// Remove type=api preferences. They are not intended for rendering in the form.
		foreach ( $preferences as $name => $info ) {
			if ( isset( $info['type'] ) && $info['type'] === 'api' ) {
				unset( $preferences[$name] );
			}
		}

		$filteredPrefs = [];
		$sections = [];
		$rlModules = [];
		foreach ( $preferences as $key => $preference ) {
			$filteredPref = $preference;

			$section = $filteredPref['section'] ?? '';

			$sectionParts = explode( '/', $section );
			if ( !isset( $sections[ $sectionParts[0] ] ) ) {
				$sections[ $sectionParts[0] ] = [
					'message' => Message::newFromKey( 'prefs-' . $sectionParts[0] )->text()
				];
			}
			if ( isset( $sectionParts[1] ) && !isset( $sections[ $sectionParts[0] ]['sections'][$sectionParts[1]] ) ) {
				$sections[ $sectionParts[0] ]['sections'][ $sectionParts[1] ] = [
					'message' => Message::newFromKey( 'prefs-' . $sectionParts[1] )->parse()
				];
			}

			if ( isset( $filteredPref['rl-modules'] ) ) {
				$rlModules = array_merge( $rlModules, $filteredPref['rl-modules'] );
			}
			if ( !empty( $filteredPref['label-message'] ) ) {
				if ( is_string( $filteredPref['label-message'] ) ) {
					$filteredPref['label-message'] = $this->getMessage( $filteredPref['label-message'] );
				} elseif ( is_array( $filteredPref['label-message'] ) ) {
					$filteredPref['label-message'] = $this->getMessageWithParams( $filteredPref['label-message'] );
				} else {
					$filteredPref['label-message'] =
						$this->getMessage( 'enhanced-standard-uis-preferences-' . $key . '-label' );
				}
			}

			if ( isset( $filteredPref['label'] ) ) {
				$decoded = html_entity_decode( $filteredPref['label'], ENT_QUOTES | ENT_HTML5, 'UTF-8' );
				$trimmed = trim( $decoded, "\xC2\xA0 \t\n\r\0\x0B" );
				$filteredPref['label'] = $trimmed;
			}
			if ( empty( $filteredPref['label-message'] ) && empty( $filteredPref['label'] ) ) {
				$filteredPref['label-message'] =
					$this->getMessage( 'enhanced-standard-uis-preferences-' . $key . '-label' );
			}

			if ( isset( $filteredPref['options-messages'] ) ) {
				foreach ( $filteredPref['options-messages'] as $key => $value ) {
					$messageKey = Message::newFromKey( $key )->text();
					$filteredPref['options-messages'][ $messageKey ] = $value;
					unset( $filteredPref['options-messages'][$key] );
				}
			}
			if ( isset( $filteredPref['help-message'] ) ) {
				if ( is_string( $filteredPref['help-message'] ) ) {
					$filteredPref['help-message'] = $this->getMessage( $filteredPref['help-message'] );
				} elseif ( is_array( $filteredPref['help-message'] ) ) {
					$filteredPref['help-message'] = $this->getMessageWithParams( $filteredPref['help-message'] );
				}
			}
			if ( isset( $filteredPref['default'] ) && $filteredPref['default'] instanceof Closure ) {
				$filteredPref['default'] = $filteredPref['default']( $filteredPref );
			}
			if ( isset( $filteredPref['rawrow'] ) ) {
				$filteredPref['raw'] = true;
				if ( $filteredPref['default'] instanceof FieldLayout ) {
					$filteredPref['default'] = $filteredPref['default']->toString();
				}
			}
			if ( $key === 'timecorrection' ) {
				$filteredPref['options'] = $this->getTimeCorrectionOptions();
			}
			$filteredPref['pref'] = $key;
			if ( isset( $sectionParts[1] ) ) {
				$filteredPrefs[ $sectionParts[0] ][ $sectionParts[1] ][] = $filteredPref;
			} else {
				$filteredPrefs[ $sectionParts[0] ][] = $filteredPref;
			}
		}
		$out->addModules( [ 'ext.enhancedstandarduis.special.preferences' ] );

		$html = Html::element( 'div', [
			'id' => 'enhanced-preferences',
			'class' => 'enhanced-preferences',
			'data-prefs' => json_encode( $filteredPrefs ),
			'data-sections' => json_encode( $sections ),
			'data-modules' => json_encode( array_unique( $rlModules ) )
		] );
		$out->addHTML( $html );
	}

	/**
	 * @return array
	 */
	private function getTimeCorrectionOptions() {
		$opt = [];

		$localTZoffset = $this->config->get( MainConfigNames::LocalTZoffset );
		$timeZoneList = $this->getTimeZoneList();

		$timestamp = MWTimestamp::getLocalInstance();
		// Check that the LocalTZoffset is the same as the local time zone offset
		if ( $localTZoffset === (int)$timestamp->format( 'Z' ) / 60 ) {
			$timezoneName = $timestamp->getTimezone()->getName();
			// Localize timezone
			if ( isset( $timeZoneList[$timezoneName] ) ) {
				$timezoneName = $timeZoneList[$timezoneName]['name'];
			}
			$server_tz_msg = $this->msgFormatter->format(
				MessageValue::new( 'timezoneuseserverdefault', [ $timezoneName ] )
			);
		} else {
			$tzstring = UserTimeCorrection::formatTimezoneOffset( $localTZoffset );
			$server_tz_msg = $this->msgFormatter->format(
				MessageValue::new( 'timezoneuseserverdefault', [ $tzstring ] )
			);
		}
		$opt['default'][$server_tz_msg] = "System|$localTZoffset";

		foreach ( $timeZoneList as $timeZoneInfo ) {
			$region = $timeZoneInfo['region'];
			if ( !isset( $opt[$region] ) ) {
				$opt[$region] = [];
			}
			$opt[$region][$timeZoneInfo['name']] = $timeZoneInfo['timecorrection'];
		}
		return $opt;
	}

	/**
	 * @param array $msgParams
	 * @return string
	 */
	private function getMessageWithParams( $msgParams ) {
		$msgKey = $msgParams[0];
		$params = array_slice( $msgParams, 1 );
		$combinedParams = '';
		foreach ( $params as $param ) {
			if ( $param instanceof ScalarParam ) {
				$combinedParams .= $param->getValue() . ',';
			} else {
				$combinedParams .= $param . ',';
			}
		}
		$combinedParams = substr( $combinedParams, 0, -1 );
		return $this->getMessage( $msgKey, $combinedParams );
	}

	/**
	 * @param string $key
	 * @param array $params
	 * @return string
	 */
	private function getMessage( $key, $params = [] ) {
		if ( empty( $params ) ) {
			$msg = Message::newFromKey( $key );
			if ( !$msg->exists() ) {
				return '';
			}
			$msgText = $msg->parse();
			return $msgText;
		}
		$msg = Message::newFromKey( $key, $params );
		if ( !$msg->exists() ) {
			return '';
		}
		return $msg->parse();
	}

	/**
	 * Get a list of all time zones
	 * @return string[][] A list of all time zones. The system name of the time zone is used as key and
	 *  the value is an array which contains localized name, the timecorrection value used for
	 *  preferences and the region
	 */
	private function getTimeZoneList(): array {
		$identifiers = DateTimeZone::listIdentifiers();
		'@phan-var array|false $identifiers';
		// See phan issue #3162
		if ( $identifiers === false ) {
			return [];
		}
		sort( $identifiers );

		$tzRegions = [
			'Africa' => $this->msgFormatter->format( MessageValue::new( 'timezoneregion-africa' ) ),
			'America' => $this->msgFormatter->format( MessageValue::new( 'timezoneregion-america' ) ),
			'Antarctica' => $this->msgFormatter->format( MessageValue::new( 'timezoneregion-antarctica' ) ),
			'Arctic' => $this->msgFormatter->format( MessageValue::new( 'timezoneregion-arctic' ) ),
			'Asia' => $this->msgFormatter->format( MessageValue::new( 'timezoneregion-asia' ) ),
			'Atlantic' => $this->msgFormatter->format( MessageValue::new( 'timezoneregion-atlantic' ) ),
			'Australia' => $this->msgFormatter->format( MessageValue::new( 'timezoneregion-australia' ) ),
			'Europe' => $this->msgFormatter->format( MessageValue::new( 'timezoneregion-europe' ) ),
			'Indian' => $this->msgFormatter->format( MessageValue::new( 'timezoneregion-indian' ) ),
			'Pacific' => $this->msgFormatter->format( MessageValue::new( 'timezoneregion-pacific' ) ),
		];
		asort( $tzRegions );

		$timeZoneList = [];

		$now = new DateTime();

		foreach ( $identifiers as $identifier ) {
			$parts = explode( '/', $identifier, 2 );

			// DateTimeZone::listIdentifiers() returns a number of
			// backwards-compatibility entries. This filters them out of the
			// list presented to the user.
			if ( count( $parts ) !== 2 || !array_key_exists( $parts[0], $tzRegions ) ) {
				continue;
			}

			// Localize region
			$parts[0] = $tzRegions[$parts[0]];

			$dateTimeZone = new DateTimeZone( $identifier );
			$minDiff = floor( $dateTimeZone->getOffset( $now ) / 60 );

			$display = str_replace( '_', ' ', $parts[0] . '/' . $parts[1] );
			$value = "ZoneInfo|$minDiff|$identifier";

			$timeZoneList[$identifier] = [
				'name' => $display,
				'timecorrection' => $value,
				'region' => $parts[0],
			];
		}

		return $timeZoneList;
	}
}
