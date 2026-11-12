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
 * local_gopilot_upload_portfolio_file: attach a file (Base64) to an own entry.
 *
 * @package    local_gopilot
 * @copyright  2026 Jörg Tuttas
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class upload_portfolio_file extends external_api {
    /**
     * Parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'entryid' => new external_value(PARAM_INT, 'Entry id'),
            'filename' => new external_value(PARAM_FILE, 'File name'),
            'content' => new external_value(PARAM_RAW, 'File content, Base64'),
        ]);
    }

    /**
     * Store the file.
     *
     * @param int $entryid
     * @param string $filename
     * @param string $content
     * @return array portfoliofile
     */
    public static function execute(int $entryid, string $filename, string $content): array {
        global $USER;
        $params = self::validate_parameters(
            self::execute_parameters(),
            ['entryid' => $entryid, 'filename' => $filename, 'content' => $content]
        );
        $record = portfolio::get_entry($params['entryid']);
        $context = context_course::instance((int)$record->courseid);
        self::validate_context($context);
        require_capability('local/gopilot:use', $context);
        $portfolio = new portfolio();
        $file = $portfolio->add_file((int)$USER->id, $params['entryid'], $params['filename'], $params['content']);
        return $portfolio->export_file($file);
    }

    /**
     * Return structure.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return structures::portfoliofile();
    }
}
