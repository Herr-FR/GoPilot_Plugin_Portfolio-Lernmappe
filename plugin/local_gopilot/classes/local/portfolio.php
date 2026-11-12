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

namespace local_gopilot\local;

use context_course;
use invalid_parameter_exception;
use moodle_exception;
use moodle_url;

/**
 * Portfolio entries of learners (docs/api-v1.md, section "Portfolio").
 *
 * An entry belongs to one learner and one course. Drafts are only returned to the learner; once submitted,
 * the coaches of the course see the entry and can give feedback with a status.
 *
 * @package    local_gopilot
 * @copyright  2026 Jörg Tuttas
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class portfolio {
    /** @var string[] allowed categories */
    const CATEGORIES = ['ergebnis', 'reflexion', 'strategie', 'ziel', 'feedback', 'tagebuch', 'nachweis'];

    /** @var string[] statuses a coach can set */
    const FEEDBACK_STATUSES = ['feedback', 'revise', 'done'];

    /** @var string[] statuses in which the learner may edit an entry */
    const EDITABLE = ['draft', 'revise'];

    /** @var string file area of attachments */
    const FILEAREA = 'portfolio';

    /** @var int maximum number of attachments per entry */
    const MAXFILES = 10;

    /** @var int upper bound for one attachment in bytes */
    const MAXFILESIZE = 10485760;

    /** @var int maximum number of links per entry */
    const MAXLINKS = 20;

    /** @var int current time */
    protected $now;

    /** @var string[] cache of full names */
    protected $names = [];

    /**
     * Constructor.
     *
     * @param int|null $now current time (tests)
     */
    public function __construct(?int $now = null) {
        $this->now = $now ?? time();
    }

    /**
     * Maximum size of one attachment in bytes for a course.
     *
     * @param int $courseid
     * @return int
     */
    public static function max_file_size(int $courseid): int {
        global $CFG;
        $course = get_course($courseid);
        $limit = get_max_upload_file_size($CFG->maxbytes, $course->maxbytes);
        // The content arrives Base64-encoded in the POST body, which is a third larger.
        $postmax = get_real_size(ini_get('post_max_size'));
        if ($postmax > 0) {
            $limit = min($limit, (int)floor($postmax * 0.74));
        }
        return (int)min($limit, self::MAXFILESIZE);
    }

    /**
     * Entry record or exception.
     *
     * @param int $id
     * @return \stdClass
     * @throws moodle_exception
     */
    public static function get_entry(int $id): \stdClass {
        global $DB;
        $record = $DB->get_record('local_gopilot_portfolio', ['id' => $id]);
        if (!$record) {
            throw new moodle_exception('portfolionotfound', 'local_gopilot');
        }
        return $record;
    }

    /**
     * Entry record that belongs to the user, who must still be a learner in its course.
     *
     * @param int $id
     * @param int $userid
     * @return \stdClass
     * @throws moodle_exception
     */
    public static function get_own_entry(int $id, int $userid): \stdClass {
        $record = self::get_entry($id);
        if ((int)$record->userid !== $userid) {
            throw new moodle_exception('portfolionotfound', 'local_gopilot');
        }
        access::require_learner((int)$record->courseid, $userid);
        return $record;
    }

    /**
     * Throw unless the learner may change the entry (draft or revise).
     *
     * @param \stdClass $record
     * @throws moodle_exception
     */
    public static function require_editable(\stdClass $record): void {
        if (!in_array($record->status, self::EDITABLE, true)) {
            throw new moodle_exception('portfolionoedit', 'local_gopilot');
        }
    }

    /**
     * Whether the viewer may see the entry (owner, or coach of the course for submitted entries).
     *
     * @param \stdClass $record
     * @param int $viewerid
     * @return bool
     */
    public static function can_view(\stdClass $record, int $viewerid): bool {
        if ((int)$record->userid === $viewerid) {
            return access::is_learner((int)$record->courseid, $viewerid);
        }
        return $record->status !== 'draft'
            && access::is_learner((int)$record->courseid, (int)$record->userid)
            && access::is_coach((int)$record->courseid, $viewerid);
    }

    /**
     * Create or change an entry of the learner.
     *
     * @param int $userid learner
     * @param array $data id, courseid, category, title, entrydate, fields, selflevel, tags, links
     * @return \stdClass record
     * @throws moodle_exception
     */
    public function save(int $userid, array $data): \stdClass {
        global $DB;
        $category = (string)$data['category'];
        if (!in_array($category, self::CATEGORIES, true)) {
            throw new moodle_exception('invalidportfoliocategory', 'local_gopilot');
        }
        $title = trim((string)$data['title']);
        if ($title === '') {
            throw new moodle_exception('portfoliotitlemissing', 'local_gopilot');
        }
        $entrydate = trim((string)$data['entrydate']);
        if ($entrydate !== '' && !self::valid_date($entrydate)) {
            throw new moodle_exception('invalidportfoliodate', 'local_gopilot');
        }
        $selflevel = (int)$data['selflevel'];
        if ($selflevel < 0 || $selflevel > 4) {
            throw new invalid_parameter_exception('selflevel must be between 0 and 4');
        }

        $fields = [];
        foreach ($data['fields'] as $field) {
            $value = trim((string)$field['value']);
            if ($value !== '') {
                $fields[(string)$field['key']] = \core_text::substr($value, 0, 10000);
            }
        }
        $links = [];
        foreach (array_slice($data['links'], 0, self::MAXLINKS) as $link) {
            $url = trim((string)$link['url']);
            if (!preg_match('~^https?://~i', $url) || clean_param($url, PARAM_URL) !== $url) {
                throw new moodle_exception('invalidportfoliolink', 'local_gopilot');
            }
            $label = trim((string)$link['label']);
            $links[] = ['label' => \core_text::substr($label !== '' ? $label : $url, 0, 255), 'url' => $url];
        }

        $values = [
            'category' => $category,
            'title' => \core_text::substr($title, 0, 255),
            'entrydate' => $entrydate,
            'fields' => json_encode((object)$fields),
            'selflevel' => $selflevel,
            'tags' => \core_text::substr(trim((string)$data['tags']), 0, 255),
            'links' => json_encode($links),
            'timemodified' => $this->now,
        ];

        if (empty($data['id'])) {
            access::require_learner((int)$data['courseid'], $userid);
            $record = (object)array_merge($values, [
                'userid' => $userid,
                'courseid' => (int)$data['courseid'],
                'status' => 'draft',
                'revision' => 0,
                'timesubmitted' => 0,
                'timeread' => 0,
                'timecreated' => $this->now,
            ]);
            $record->id = $DB->insert_record('local_gopilot_portfolio', $record);
            return $record;
        }

        $record = self::get_own_entry((int)$data['id'], $userid);
        if ((int)$record->courseid !== (int)$data['courseid']) {
            throw new moodle_exception('portfolionotfound', 'local_gopilot');
        }
        self::require_editable($record);
        foreach ($values as $key => $value) {
            $record->$key = $value;
        }
        $DB->update_record('local_gopilot_portfolio', $record);
        return $record;
    }

    /**
     * Submit or withdraw an entry of the learner.
     *
     * @param int $userid
     * @param int $id
     * @param string $action submit or withdraw
     * @return \stdClass record
     * @throws moodle_exception
     */
    public function change_status(int $userid, int $id, string $action): \stdClass {
        global $DB;
        $record = self::get_own_entry($id, $userid);
        if ($action === 'submit' && in_array($record->status, self::EDITABLE, true)) {
            $record->status = 'submitted';
            $record->revision = (int)$record->revision + 1;
            $record->timesubmitted = $this->now;
            $record->timemodified = $this->now;
            $DB->update_record('local_gopilot_portfolio', $record);
            $this->notify_submitted($record);
            return $record;
        }
        if (
            $action === 'withdraw' && $record->status === 'submitted'
                && !$DB->record_exists('local_gopilot_portfoliofb', ['entryid' => $record->id])
        ) {
            $record->status = 'draft';
            $record->revision = max(0, (int)$record->revision - 1);
            $record->timemodified = $this->now;
            $DB->update_record('local_gopilot_portfolio', $record);
            return $record;
        }
        throw new moodle_exception('portfolioinvalidstatus', 'local_gopilot');
    }

    /**
     * Delete a draft of the learner with its files.
     *
     * @param int $userid
     * @param int $id
     * @throws moodle_exception
     */
    public function delete(int $userid, int $id): void {
        $record = self::get_own_entry($id, $userid);
        if ($record->status !== 'draft') {
            throw new moodle_exception('portfolionoedit', 'local_gopilot');
        }
        self::delete_records([$record]);
    }

    /**
     * Delete entries with their feedback and files (also used by the privacy provider).
     *
     * @param \stdClass[] $records
     */
    public static function delete_records(array $records): void {
        global $DB;
        $fs = get_file_storage();
        foreach ($records as $record) {
            $context = \context_course::instance((int)$record->courseid, IGNORE_MISSING);
            if ($context) {
                $fs->delete_area_files($context->id, 'local_gopilot', self::FILEAREA, (int)$record->id);
            }
            $DB->delete_records('local_gopilot_portfoliofb', ['entryid' => $record->id]);
            $DB->delete_records('local_gopilot_portfolio', ['id' => $record->id]);
        }
    }

    /**
     * Store an attachment for an entry of the learner.
     *
     * @param int $userid
     * @param int $entryid
     * @param string $filename
     * @param string $content Base64
     * @return \stored_file
     * @throws moodle_exception
     */
    public function add_file(int $userid, int $entryid, string $filename, string $content): \stored_file {
        $record = self::get_own_entry($entryid, $userid);
        self::require_editable($record);
        $filename = clean_param(trim($filename), PARAM_FILE);
        if ($filename === '') {
            throw new invalid_parameter_exception('Invalid file name');
        }
        $data = base64_decode($content, true);
        if ($data === false || $data === '') {
            throw new invalid_parameter_exception('Content is not valid Base64');
        }
        if (strlen($data) > self::max_file_size((int)$record->courseid)) {
            throw new moodle_exception('portfoliofiletoobig', 'local_gopilot');
        }
        $context = context_course::instance((int)$record->courseid);
        $fs = get_file_storage();
        $existing = $fs->get_area_files($context->id, 'local_gopilot', self::FILEAREA, $record->id, 'id', false);
        if (count($existing) >= self::MAXFILES) {
            throw new moodle_exception('portfoliotoomanyfiles', 'local_gopilot', '', self::MAXFILES);
        }
        $filename = $fs->get_unused_filename($context->id, 'local_gopilot', self::FILEAREA, $record->id, '/', $filename);
        $file = $fs->create_file_from_string([
            'contextid' => $context->id,
            'component' => 'local_gopilot',
            'filearea' => self::FILEAREA,
            'itemid' => $record->id,
            'filepath' => '/',
            'filename' => $filename,
            'userid' => $userid,
        ], $data);
        $this->touch($record);
        return $file;
    }

    /**
     * Remove an attachment from an entry of the learner.
     *
     * @param int $userid
     * @param int $entryid
     * @param int $fileid
     * @throws moodle_exception
     */
    public function delete_file(int $userid, int $entryid, int $fileid): void {
        $record = self::get_own_entry($entryid, $userid);
        self::require_editable($record);
        $context = context_course::instance((int)$record->courseid);
        foreach (get_file_storage()->get_area_files($context->id, 'local_gopilot', self::FILEAREA, $record->id) as $file) {
            if ((int)$file->get_id() === $fileid && !$file->is_directory()) {
                $file->delete();
                $this->touch($record);
                return;
            }
        }
        throw new moodle_exception('portfoliofilenotfound', 'local_gopilot');
    }

    /**
     * Feedback by a coach; sets the status of the entry and notifies the learner.
     *
     * @param int $authorid
     * @param int $id
     * @param string $message
     * @param string $status feedback, revise or done
     * @return \stdClass entry record
     * @throws moodle_exception
     */
    public function add_feedback(int $authorid, int $id, string $message, string $status): \stdClass {
        global $DB;
        if (!in_array($status, self::FEEDBACK_STATUSES, true)) {
            throw new invalid_parameter_exception('Invalid status');
        }
        $record = self::get_entry($id);
        require_capability('local/gopilot:coach', context_course::instance((int)$record->courseid), $authorid);
        access::require_learner((int)$record->courseid, (int)$record->userid);
        if ($record->status === 'draft') {
            throw new moodle_exception('portfolioinvalidstatus', 'local_gopilot');
        }
        $message = trim($message);
        if ($message === '' && $status !== 'done') {
            throw new moodle_exception('emptymessage', 'local_gopilot');
        }
        $feedback = (object)[
            'entryid' => $record->id,
            'authorid' => $authorid,
            'message' => $message,
            'status' => $status,
            'revision' => (int)$record->revision,
            'timecreated' => $this->now,
        ];
        $feedback->id = $DB->insert_record('local_gopilot_portfoliofb', $feedback);
        $record->status = $status;
        $record->timemodified = $this->now;
        $DB->update_record('local_gopilot_portfolio', $record);

        $context = context_course::instance((int)$record->courseid);
        \local_gopilot\event\portfolio_feedback_added::create([
            'objectid' => $feedback->id,
            'context' => $context,
            'relateduserid' => (int)$record->userid,
            'other' => ['entryid' => (int)$record->id],
        ])->trigger();

        $author = \core_user::get_user($authorid);
        $a = (object)[
            'author' => fullname($author),
            'course' => format_string(get_course($record->courseid)->fullname, true, ['context' => $context]),
            'title' => $record->title,
            'status' => get_string('portfoliostatus_' . $status, 'local_gopilot'),
            'message' => \core_text::substr($message, 0, 200),
        ];
        notifier::send(
            'portfolio',
            (int)$record->userid,
            $author,
            get_string('notify_portfoliofeedback_subject', 'local_gopilot', $a),
            get_string('notify_portfoliofeedback_body', 'local_gopilot', $a),
            '/portfolio/' . $record->courseid . '/' . $record->id,
            (int)$record->courseid
        );
        return $record;
    }

    /**
     * Mark the feedback on entries of the learner as read.
     *
     * @param int $userid
     * @param int[] $ids
     * @return int number of entries marked
     */
    public function mark_read(int $userid, array $ids): int {
        global $DB;
        $marked = 0;
        foreach (array_unique(array_map('intval', $ids)) as $id) {
            $record = $DB->get_record('local_gopilot_portfolio', ['id' => $id, 'userid' => $userid]);
            if ($record && $this->is_unread($record)) {
                $DB->set_field('local_gopilot_portfolio', 'timeread', $this->now, ['id' => $id]);
                $marked++;
            }
        }
        return $marked;
    }

    /**
     * Entries of a learner in a course, newest change first.
     *
     * @param int $courseid
     * @param int $userid
     * @param bool $submittedonly without drafts (coach view)
     * @return \stdClass[]
     */
    public function entries(int $courseid, int $userid, bool $submittedonly): array {
        global $DB;
        $select = 'courseid = :courseid AND userid = :userid';
        if ($submittedonly) {
            $select .= " AND status <> 'draft'";
        }
        return array_values($DB->get_records_select(
            'local_gopilot_portfolio',
            $select,
            ['courseid' => $courseid, 'userid' => $userid],
            'timemodified DESC, id DESC'
        ));
    }

    /**
     * Learners of a course with counts of their submitted entries, and submitted entries (coach view).
     *
     * @param int $courseid
     * @param int $userid 0 = entries of all learners
     * @return array [learners, entry records]
     */
    public function course_overview(int $courseid, int $userid): array {
        global $DB;
        $context = context_course::instance($courseid);
        $users = get_enrolled_users($context, 'local/gopilot:use', 0, 'u.*', 'u.lastname, u.firstname', 0, 0, true);
        $learners = [];
        foreach ($users as $user) {
            if (!access::is_learner($courseid, (int)$user->id)) {
                continue;
            }
            $learners[(int)$user->id] = [
                'id' => (int)$user->id,
                'fullname' => fullname($user),
                'total' => 0,
                'open' => 0,
                'revise' => 0,
                'done' => 0,
                'lastsubmitted' => 0,
            ];
        }
        if ($userid && !isset($learners[$userid])) {
            throw new moodle_exception('notalearner', 'local_gopilot');
        }
        $records = $DB->get_records_select(
            'local_gopilot_portfolio',
            "courseid = :courseid AND status <> 'draft'",
            ['courseid' => $courseid],
            'timesubmitted DESC, id DESC'
        );
        $entries = [];
        foreach ($records as $record) {
            $uid = (int)$record->userid;
            if (!isset($learners[$uid])) {
                continue;
            }
            $learners[$uid]['total']++;
            if ($record->status === 'submitted') {
                $learners[$uid]['open']++;
            } else if ($record->status === 'revise') {
                $learners[$uid]['revise']++;
            } else if ($record->status === 'done') {
                $learners[$uid]['done']++;
            }
            $learners[$uid]['lastsubmitted'] = max($learners[$uid]['lastsubmitted'], (int)$record->timesubmitted);
            if (!$userid || $uid === $userid) {
                $entries[] = $record;
            }
        }
        usort($entries, function ($a, $b) {
            $open = (int)($b->status === 'submitted') <=> (int)($a->status === 'submitted');
            return $open ?: ((int)$b->timesubmitted <=> (int)$a->timesubmitted);
        });
        return [array_values($learners), $entries];
    }

    /**
     * Entry record as portfolioentry structure.
     *
     * @param \stdClass $record
     * @return array
     */
    public function export(\stdClass $record): array {
        global $DB;
        $fields = [];
        foreach ((array)json_decode((string)$record->fields, true) as $key => $value) {
            $fields[] = ['key' => (string)$key, 'value' => (string)$value];
        }
        $links = [];
        foreach ((array)json_decode((string)$record->links, true) as $link) {
            $links[] = ['label' => (string)($link['label'] ?? ''), 'url' => (string)($link['url'] ?? '')];
        }
        $feedback = [];
        foreach ($DB->get_records('local_gopilot_portfoliofb', ['entryid' => $record->id], 'timecreated ASC, id ASC') as $fb) {
            $feedback[] = [
                'id' => (int)$fb->id,
                'authorid' => (int)$fb->authorid,
                'authorname' => $this->fullname((int)$fb->authorid),
                'message' => (string)$fb->message,
                'status' => (string)$fb->status,
                'revision' => (int)$fb->revision,
                'timecreated' => (int)$fb->timecreated,
            ];
        }
        return [
            'id' => (int)$record->id,
            'userid' => (int)$record->userid,
            'learnername' => $this->fullname((int)$record->userid),
            'courseid' => (int)$record->courseid,
            'category' => (string)$record->category,
            'title' => (string)$record->title,
            'entrydate' => (string)$record->entrydate,
            'fields' => $fields,
            'selflevel' => (int)$record->selflevel,
            'tags' => (string)$record->tags,
            'links' => $links,
            'status' => (string)$record->status,
            'revision' => (int)$record->revision,
            'timesubmitted' => (int)$record->timesubmitted,
            'timecreated' => (int)$record->timecreated,
            'timemodified' => (int)$record->timemodified,
            'unread' => $this->is_unread($record),
            'files' => array_map([$this, 'export_file'], self::files($record)),
            'feedback' => $feedback,
        ];
    }

    /**
     * Attachments of an entry.
     *
     * @param \stdClass $record
     * @return \stored_file[]
     */
    public static function files(\stdClass $record): array {
        $context = context_course::instance((int)$record->courseid);
        return array_values(get_file_storage()->get_area_files(
            $context->id,
            'local_gopilot',
            self::FILEAREA,
            $record->id,
            'filename',
            false
        ));
    }

    /**
     * File as portfoliofile structure.
     *
     * @param \stored_file $file
     * @return array
     */
    public function export_file(\stored_file $file): array {
        $url = moodle_url::make_pluginfile_url(
            $file->get_contextid(),
            'local_gopilot',
            self::FILEAREA,
            $file->get_itemid(),
            $file->get_filepath(),
            $file->get_filename()
        );
        return [
            'id' => (int)$file->get_id(),
            'filename' => $file->get_filename(),
            'mimetype' => (string)$file->get_mimetype(),
            'filesize' => (int)$file->get_filesize(),
            'url' => $url->out(false),
        ];
    }

    /**
     * Whether the entry has feedback the learner has not read yet.
     *
     * @param \stdClass $record
     * @return bool
     */
    protected function is_unread(\stdClass $record): bool {
        return $this->latest_feedback_time($record) > (int)$record->timeread;
    }

    /**
     * Time of the newest feedback on the entry.
     *
     * @param \stdClass $record
     * @return int
     */
    protected function latest_feedback_time(\stdClass $record): int {
        global $DB;
        return (int)$DB->get_field_sql(
            'SELECT MAX(timecreated) FROM {local_gopilot_portfoliofb} WHERE entryid = ?',
            [$record->id]
        );
    }

    /**
     * Update timemodified of an entry.
     *
     * @param \stdClass $record
     */
    protected function touch(\stdClass $record): void {
        global $DB;
        $DB->set_field('local_gopilot_portfolio', 'timemodified', $this->now, ['id' => $record->id]);
    }

    /**
     * Notify the coaches of the course that an entry was submitted.
     *
     * @param \stdClass $record
     */
    protected function notify_submitted(\stdClass $record): void {
        $context = context_course::instance((int)$record->courseid);
        \local_gopilot\event\portfolio_submitted::create([
            'objectid' => (int)$record->id,
            'context' => $context,
            'relateduserid' => (int)$record->userid,
            'other' => ['revision' => (int)$record->revision],
        ])->trigger();

        $learner = \core_user::get_user((int)$record->userid);
        $a = (object)[
            'learner' => fullname($learner),
            'course' => format_string(get_course($record->courseid)->fullname, true, ['context' => $context]),
            'title' => $record->title,
            'revision' => (int)$record->revision,
        ];
        $key = (int)$record->revision > 1 ? 'notify_portfolioresubmitted' : 'notify_portfoliosubmitted';
        foreach (planner::coaches((int)$record->courseid, (int)$record->userid) as $coachid) {
            notifier::send(
                'portfolio',
                $coachid,
                $learner,
                get_string($key . '_subject', 'local_gopilot', $a),
                get_string($key . '_body', 'local_gopilot', $a),
                '/lerndoku/' . $record->courseid . '/' . $record->userid . '/portfolio',
                (int)$record->courseid
            );
        }
    }

    /**
     * Full name of a user (cached).
     *
     * @param int $userid
     * @return string
     */
    protected function fullname(int $userid): string {
        if (!isset($this->names[$userid])) {
            $user = \core_user::get_user($userid);
            $this->names[$userid] = $user ? fullname($user) : '';
        }
        return $this->names[$userid];
    }

    /**
     * Whether a string is a valid date YYYY-MM-DD.
     *
     * @param string $date
     * @return bool
     */
    protected static function valid_date(string $date): bool {
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $m)) {
            return false;
        }
        return checkdate((int)$m[2], (int)$m[3], (int)$m[1]);
    }
}
