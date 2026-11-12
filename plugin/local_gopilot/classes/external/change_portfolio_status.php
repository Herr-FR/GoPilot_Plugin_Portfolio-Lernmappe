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

namespace local_gopilot\external;

use context_course;
use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use local_gopilot\local\portfolio;

/**
 * local_gopilot_change_portfolio_status: submit or withdraw an own entry.
 *
 * @package    local_gopilot
 * @copyright  2026 Jörg Tuttas
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class change_portfolio_status extends external_api {
    /**
     * Parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'id' => new external_value(PARAM_INT, 'Entry id'),
            'action' => new external_value(PARAM_ALPHA, 'submit or withdraw'),
        ]);
    }

    /**
     * Change the status.
     *
     * @param int $id
     * @param string $action
     * @return array portfolioentry
     */
    public static function execute(int $id, string $action): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['id' => $id, 'action' => $action]);
        $record = portfolio::get_entry($params['id']);
        $context = context_course::instance((int)$record->courseid);
        self::validate_context($context);
        require_capability('local/gopilot:use', $context);
        $portfolio = new portfolio();
        return $portfolio->export($portfolio->change_status((int)$USER->id, $params['id'], $params['action']));
    }

    /**
     * Return structure.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return structures::portfolioentry();
    }
}
