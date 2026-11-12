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
 * local_gopilot_add_portfolio_feedback: coach feedback on a submitted entry.
 *
 * @package    local_gopilot
 * @copyright  2026 Jörg Tuttas
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class add_portfolio_feedback extends external_api {
    /**
     * Parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'id' => new external_value(PARAM_INT, 'Entry id'),
            'message' => new external_value(PARAM_TEXT, 'Message', VALUE_DEFAULT, ''),
            'status' => new external_value(PARAM_ALPHA, 'feedback, revise or done'),
        ]);
    }

    /**
     * Add the feedback.
     *
     * @param int $id
     * @param string $message
     * @param string $status
     * @return array portfolioentry
     */
    public static function execute(int $id, string $message, string $status): array {
        global $USER;
        $params = self::validate_parameters(
            self::execute_parameters(),
            ['id' => $id, 'message' => $message, 'status' => $status]
        );
        $record = portfolio::get_entry($params['id']);
        $context = context_course::instance((int)$record->courseid);
        self::validate_context($context);
        require_capability('local/gopilot:coach', $context);
        $portfolio = new portfolio();
        return $portfolio->export(
            $portfolio->add_feedback((int)$USER->id, $params['id'], $params['message'], $params['status'])
        );
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
