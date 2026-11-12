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
use local_gopilot\local\portfolio;

/**
 * local_gopilot_get_course_portfolios: learners of a course with their submitted portfolio entries (coach).
 *
 * @package    local_gopilot
 * @copyright  2026 Jörg Tuttas
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_course_portfolios extends external_api {
    /**
     * Parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course id'),
            'userid' => new external_value(PARAM_INT, 'Learner user id, 0 = all', VALUE_DEFAULT, 0),
        ]);
    }

    /**
     * Learners and submitted entries.
     *
     * @param int $courseid
     * @param int $userid
     * @return array
     */
    public static function execute(int $courseid, int $userid = 0): array {
        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid, 'userid' => $userid]);
        $context = context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/gopilot:coach', $context);
        $portfolio = new portfolio();
        [$learners, $entries] = $portfolio->course_overview($params['courseid'], $params['userid']);
        $course = get_course($params['courseid']);
        return [
            'course' => [
                'id' => (int)$course->id,
                'fullname' => format_string($course->fullname, true, ['context' => $context]),
            ],
            'learners' => $learners,
            'entries' => array_map([$portfolio, 'export'], $entries),
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
            'learners' => new external_multiple_structure(new external_single_structure([
                'id' => new external_value(PARAM_INT, 'Learner user id'),
                'fullname' => new external_value(PARAM_TEXT, 'Full name'),
                'total' => new external_value(PARAM_INT, 'Submitted entries'),
                'open' => new external_value(PARAM_INT, 'Entries waiting for feedback'),
                'revise' => new external_value(PARAM_INT, 'Entries to revise'),
                'done' => new external_value(PARAM_INT, 'Finished entries'),
                'lastsubmitted' => new external_value(PARAM_INT, 'Last submission, 0 = none'),
            ])),
            'entries' => new external_multiple_structure(structures::portfolioentry()),
        ]);
    }
}
