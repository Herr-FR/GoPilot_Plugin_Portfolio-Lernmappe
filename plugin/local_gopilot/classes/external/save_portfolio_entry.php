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
 * local_gopilot_save_portfolio_entry: create a draft or change an own entry.
 *
 * @package    local_gopilot
 * @copyright  2026 Jörg Tuttas
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class save_portfolio_entry extends external_api {
    /**
     * Parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'id' => new external_value(PARAM_INT, 'Entry id, 0 = new'),
            'courseid' => new external_value(PARAM_INT, 'Course id'),
            'category' => new external_value(PARAM_ALPHA, 'Category'),
            'title' => new external_value(PARAM_TEXT, 'Title'),
            'entrydate' => new external_value(PARAM_RAW, 'YYYY-MM-DD or empty', VALUE_DEFAULT, ''),
            'fields' => new external_multiple_structure(
                new external_single_structure([
                    'key' => new external_value(PARAM_ALPHANUMEXT, 'Key of the guiding question'),
                    'value' => new external_value(PARAM_TEXT, 'Answer'),
                ]),
                'Answers',
                VALUE_DEFAULT,
                []
            ),
            'selflevel' => new external_value(PARAM_INT, '0 none, 1 sicher .. 4 komme nicht klar', VALUE_DEFAULT, 0),
            'tags' => new external_value(PARAM_TEXT, 'Tags', VALUE_DEFAULT, ''),
            'links' => new external_multiple_structure(
                new external_single_structure([
                    'label' => new external_value(PARAM_TEXT, 'Label'),
                    'url' => new external_value(PARAM_RAW, 'http(s) address'),
                ]),
                'Links',
                VALUE_DEFAULT,
                []
            ),
        ]);
    }

    /**
     * Save the entry.
     *
     * @param int $id
     * @param int $courseid
     * @param string $category
     * @param string $title
     * @param string $entrydate
     * @param array $fields
     * @param int $selflevel
     * @param string $tags
     * @param array $links
     * @return array portfolioentry
     */
    public static function execute(
        int $id,
        int $courseid,
        string $category,
        string $title,
        string $entrydate = '',
        array $fields = [],
        int $selflevel = 0,
        string $tags = '',
        array $links = []
    ): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), [
            'id' => $id,
            'courseid' => $courseid,
            'category' => $category,
            'title' => $title,
            'entrydate' => $entrydate,
            'fields' => $fields,
            'selflevel' => $selflevel,
            'tags' => $tags,
            'links' => $links,
        ]);
        $context = context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/gopilot:use', $context);
        $portfolio = new portfolio();
        return $portfolio->export($portfolio->save((int)$USER->id, $params));
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
