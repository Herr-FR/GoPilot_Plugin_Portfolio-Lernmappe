<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

namespace local_gopilot\event;

/**
 * Event portfolio_feedback_added: a coach gave feedback on a portfolio entry.
 *
 * @package    local_gopilot
 * @copyright  2026 Jörg Tuttas
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class portfolio_feedback_added extends \core\event\base {
    /**
     * Init method.
     *
     * @return void
     */
    protected function init() {
        $this->data['objecttable'] = 'local_gopilot_portfoliofb';
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }

    /**
     * Localised event name.
     *
     * @return string
     */
    public static function get_name() {
        return get_string('event_portfolio_feedback_added', 'local_gopilot');
    }

    /**
     * Non-localised description.
     *
     * @return string
     */
    public function get_description() {
        $entryid = $this->other['entryid'] ?? 0;
        return "The user with id '$this->userid' added the feedback with id '$this->objectid' " .
            "to the portfolio entry with id '$entryid' of the user with id '$this->relateduserid'.";
    }

    /**
     * Validate custom data.
     *
     * @return void
     */
    protected function validate_data() {
        parent::validate_data();
        if (!isset($this->relateduserid)) {
            throw new \coding_exception('The relateduserid must be set.');
        }
        if (!isset($this->other['entryid'])) {
            throw new \coding_exception('The entryid must be set in other.');
        }
    }

    /**
     * Mapping for backup/restore of objectid.
     *
     * @return array
     */
    public static function get_objectid_mapping() {
        return ['db' => 'local_gopilot_portfoliofb', 'restore' => \core\event\base::NOT_MAPPED];
    }

    /**
     * Mapping for other fields.
     *
     * @return bool
     */
    public static function get_other_mapping() {
        return false;
    }
}
