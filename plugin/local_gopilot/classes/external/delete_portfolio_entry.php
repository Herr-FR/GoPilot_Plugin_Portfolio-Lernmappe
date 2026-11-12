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
 * local_gopilot_delete_portfolio_entry: delete an own draft.
 *
 * @package    local_gopilot
 * @copyright  2026 Jörg Tuttas
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class delete_portfolio_entry extends external_api {
    /**
     * Parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'id' => new external_value(PARAM_INT, 'Entry id'),
        ]);
    }

    /**
     * Delete the draft.
     *
     * @param int $id
     * @return array
     */
    public static function execute(int $id): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['id' => $id]);
        $record = portfolio::get_entry($params['id']);
        $context = context_course::instance((int)$record->courseid);
        self::validate_context($context);
        require_capability('local/gopilot:use', $context);
        (new portfolio())->delete((int)$USER->id, $params['id']);
        return ['success' => true];
    }

    /**
     * Return structure.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Deleted'),
        ]);
    }
}
