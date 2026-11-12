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

/**
 * Library callbacks of local_gopilot.
 *
 * @package    local_gopilot
 * @copyright  2026 Jörg Tuttas
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Serve portfolio attachments: to the owner, and to coaches of the course once the entry was submitted.
 *
 * @param stdClass $course
 * @param stdClass|null $cm
 * @param context $context
 * @param string $filearea
 * @param array $args itemid, then path and file name
 * @param bool $forcedownload
 * @param array $options
 * @return bool false if the file was not found; otherwise the file is sent and the script ends
 */
function local_gopilot_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = []) {
    global $USER;
    if ($context->contextlevel != CONTEXT_COURSE || $filearea !== \local_gopilot\local\portfolio::FILEAREA) {
        return false;
    }
    require_login($course, false);
    $itemid = (int)array_shift($args);
    try {
        $record = \local_gopilot\local\portfolio::get_entry($itemid);
    } catch (moodle_exception $e) {
        return false;
    }
    if ((int)$record->courseid !== (int)$context->instanceid) {
        return false;
    }
    if (!\local_gopilot\local\portfolio::can_view($record, (int)$USER->id)) {
        return false;
    }
    $filename = array_pop($args);
    $filepath = $args ? '/' . implode('/', $args) . '/' : '/';
    $file = get_file_storage()->get_file($context->id, 'local_gopilot', $filearea, $itemid, $filepath, $filename);
    if (!$file || $file->is_directory()) {
        return false;
    }
    send_stored_file($file, 0, 0, $forcedownload, $options);
}
