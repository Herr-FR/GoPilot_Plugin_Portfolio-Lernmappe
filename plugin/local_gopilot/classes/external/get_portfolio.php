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
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use local_gopilot\local\access;
use local_gopilot\local\portfolio;

/**
 * local_gopilot_get_portfolio: own portfolio entries in a course.
 *
 * @package    local_gopilot
 * @copyright  2026 Jörg Tuttas
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_portfolio extends external_api {
    /**
     * Parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course id'),
        ]);
    }

    /**
     * Own entries, including drafts.
     *
     * @param int $courseid
     * @return array
     */
    public static function execute(int $courseid): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);
        $context = context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/gopilot:use', $context);
        access::require_learner($params['courseid'], (int)$USER->id);
        $portfolio = new portfolio();
        $course = get_course($params['courseid']);
        return [
            'course' => [
                'id' => (int)$course->id,
                'fullname' => format_string($course->fullname, true, ['context' => $context]),
            ],
            'maxfilesize' => portfolio::max_file_size((int)$course->id),
            'entries' => array_map(
                [$portfolio, 'export'],
                $portfolio->entries((int)$course->id, (int)$USER->id, false)
            ),
        ];
    }

    /**
     * Return structure.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'course' => structures::course(),
            'maxfilesize' => new external_value(PARAM_INT, 'Maximum size of one attachment in bytes'),
            'entries' => new external_multiple_structure(structures::portfolioentry()),
        ]);
    }
}
