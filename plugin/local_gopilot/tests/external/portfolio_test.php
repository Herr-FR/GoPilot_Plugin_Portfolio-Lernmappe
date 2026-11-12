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

use core_external\external_api;

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->dirroot . '/webservice/tests/helpers.php');

/**
 * Tests for the portfolio web service functions of local_gopilot.
 *
 * @package    local_gopilot
 * @category   test
 * @copyright  2026 Jörg Tuttas
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \local_gopilot\external\get_portfolio
 * @covers     \local_gopilot\external\save_portfolio_entry
 * @covers     \local_gopilot\external\change_portfolio_status
 * @covers     \local_gopilot\external\delete_portfolio_entry
 * @covers     \local_gopilot\external\upload_portfolio_file
 * @covers     \local_gopilot\external\delete_portfolio_file
 * @covers     \local_gopilot\external\mark_portfolio_read
 * @covers     \local_gopilot\external\get_course_portfolios
 * @covers     \local_gopilot\external\add_portfolio_feedback
 * @covers     \local_gopilot\local\portfolio
 */
final class portfolio_test extends \externallib_advanced_testcase {
    /** @var \stdClass course */
    protected $course;

    /** @var \stdClass other course */
    protected $othercourse;

    /** @var \stdClass learner */
    protected $learner;

    /** @var \stdClass other learner */
    protected $other;

    /** @var \stdClass teacher of the course */
    protected $teacher;

    /** @var \stdClass teacher of the other course */
    protected $otherteacher;

    /**
     * One course with two learners and a teacher, a second course with another teacher.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        $gen = $this->getDataGenerator();
        $this->course = $gen->create_course(['fullname' => 'LF5']);
        $this->othercourse = $gen->create_course(['fullname' => 'LF8']);
        $this->learner = $gen->create_user(['firstname' => 'Ada', 'lastname' => 'Azubi']);
        $this->other = $gen->create_user(['firstname' => 'Ben', 'lastname' => 'Azubi']);
        $this->teacher = $gen->create_user(['firstname' => 'Lena', 'lastname' => 'Lehrkraft']);
        $this->otherteacher = $gen->create_user();
        $gen->enrol_user($this->learner->id, $this->course->id, 'student');
        $gen->enrol_user($this->other->id, $this->course->id, 'student');
        $gen->enrol_user($this->teacher->id, $this->course->id, 'editingteacher');
        $gen->enrol_user($this->otherteacher->id, $this->othercourse->id, 'editingteacher');
    }

    /**
     * Call a web service function like the REST server does, with return value cleaning.
     *
     * @param string $classname
     * @param array $args
     * @return mixed
     */
    protected function call(string $classname, array $args = []) {
        $class = '\\local_gopilot\\external\\' . $classname;
        $result = $class::execute(...$args);
        return external_api::clean_returnvalue($class::execute_returns(), $result);
    }

    /**
     * Assert that a call throws a moodle_exception with the error code.
     *
     * @param string $errorcode
     * @param string $classname
     * @param array $args
     */
    protected function assert_error(string $errorcode, string $classname, array $args): void {
        try {
            $this->call($classname, $args);
            $this->fail('Exception ' . $errorcode . ' expected');
        } catch (\moodle_exception $e) {
            $this->assertSame($errorcode, $e->errorcode);
        }
    }

    /**
     * Create a draft as the learner.
     *
     * @param string $title
     * @return array portfolioentry
     */
    protected function draft(string $title = 'Netzplan'): array {
        $this->setUser($this->learner);
        return $this->call('save_portfolio_entry', [
            0, $this->course->id, 'ergebnis', $title, '2026-11-12',
            [['key' => 'beschreibung', 'value' => 'Ein Netzplan für das Büro'], ['key' => 'leer', 'value' => '  ']],
            2, 'Netzwerk', [['label' => 'Moodle-Abgabe', 'url' => 'https://moodle.example.org/mod/assign/view.php?id=1']],
        ]);
    }

    /**
     * Draft, submit, feedback, revise, resubmit, done.
     */
    public function test_lifecycle(): void {
        $sink = $this->redirectMessages();
        $entry = $this->draft();
        $this->assertSame('draft', $entry['status']);
        $this->assertSame(0, $entry['revision']);
        $this->assertSame([['key' => 'beschreibung', 'value' => 'Ein Netzplan für das Büro']], $entry['fields']);
        $this->assertSame('Moodle-Abgabe', $entry['links'][0]['label']);

        // Drafts are not visible to the coach.
        $this->setUser($this->teacher);
        $overview = $this->call('get_course_portfolios', [$this->course->id, 0]);
        $this->assertSame([], $overview['entries']);
        $this->assertCount(2, $overview['learners']);

        $this->setUser($this->learner);
        $submitted = $this->call('change_portfolio_status', [$entry['id'], 'submit']);
        $this->assertSame('submitted', $submitted['status']);
        $this->assertSame(1, $submitted['revision']);
        $messages = $sink->get_messages();
        $this->assertCount(1, $messages);
        $this->assertEquals($this->teacher->id, $messages[0]->useridto);
        $this->assertSame('portfolio', $messages[0]->eventtype);
        $this->assert_error('portfolionoedit', 'save_portfolio_entry', [$entry['id'], $this->course->id, 'ergebnis', 'Neu']);

        $sink->clear();
        $this->setUser($this->teacher);
        $overview = $this->call('get_course_portfolios', [$this->course->id, 0]);
        $this->assertCount(1, $overview['entries']);
        $ada = array_values(array_filter($overview['learners'], fn($l) => $l['id'] == $this->learner->id))[0];
        $this->assertSame(1, $ada['open']);
        $revise = $this->call('add_portfolio_feedback', [$entry['id'], 'Bitte die IP-Adressen ergänzen.', 'revise']);
        $this->assertSame('revise', $revise['status']);
        $this->assertSame('Lena Lehrkraft', $revise['feedback'][0]['authorname']);
        $this->assertEquals($this->learner->id, $sink->get_messages()[0]->useridto);

        $this->setUser($this->learner);
        $own = $this->call('get_portfolio', [$this->course->id]);
        $this->assertTrue($own['entries'][0]['unread']);
        $this->assertSame(1, $this->call('mark_portfolio_read', [[$entry['id']]])['marked']);
        $this->assertFalse($this->call('get_portfolio', [$this->course->id])['entries'][0]['unread']);

        $this->call('save_portfolio_entry', [$entry['id'], $this->course->id, 'ergebnis', 'Netzplan v2']);
        $resubmitted = $this->call('change_portfolio_status', [$entry['id'], 'submit']);
        $this->assertSame(2, $resubmitted['revision']);
        $this->assert_error('portfolioinvalidstatus', 'change_portfolio_status', [$entry['id'], 'withdraw']);

        $this->setUser($this->teacher);
        $done = $this->call('add_portfolio_feedback', [$entry['id'], '', 'done']);
        $this->assertSame('done', $done['status']);
        $this->assertCount(2, $done['feedback']);
    }

    /**
     * Withdraw before feedback and delete drafts.
     */
    public function test_withdraw_and_delete(): void {
        $this->redirectMessages();
        $entry = $this->draft();
        $this->call('change_portfolio_status', [$entry['id'], 'submit']);
        $withdrawn = $this->call('change_portfolio_status', [$entry['id'], 'withdraw']);
        $this->assertSame('draft', $withdrawn['status']);
        $this->assertSame(0, $withdrawn['revision']);
        $this->assertTrue($this->call('delete_portfolio_entry', [$entry['id']])['success']);
        $this->assertSame([], $this->call('get_portfolio', [$this->course->id])['entries']);
    }

    /**
     * Validation of entries.
     */
    public function test_validation(): void {
        $this->setUser($this->learner);
        $this->assert_error('invalidportfoliocategory', 'save_portfolio_entry', [0, $this->course->id, 'quatsch', 'X']);
        $this->assert_error('portfoliotitlemissing', 'save_portfolio_entry', [0, $this->course->id, 'ergebnis', ' ']);
        $this->assert_error('invalidportfoliodate', 'save_portfolio_entry', [0, $this->course->id, 'ergebnis', 'X', '2026-02-30']);
        $this->assert_error('invalidportfoliolink', 'save_portfolio_entry', [
            0, $this->course->id, 'ergebnis', 'X', '', [], 0, '', [['label' => 'x', 'url' => 'javascript:alert(1)']],
        ]);
    }

    /**
     * Other learners and other coaches cannot see or change entries.
     */
    public function test_permissions(): void {
        $this->redirectMessages();
        $entry = $this->draft();
        $this->call('change_portfolio_status', [$entry['id'], 'submit']);

        $this->setUser($this->other);
        $this->assertSame([], $this->call('get_portfolio', [$this->course->id])['entries']);
        $this->assert_error('portfolionotfound', 'change_portfolio_status', [$entry['id'], 'withdraw']);
        $this->assert_error('portfolionotfound', 'save_portfolio_entry', [$entry['id'], $this->course->id, 'ergebnis', 'X']);
        $this->expectException(\required_capability_exception::class);
        $this->call('add_portfolio_feedback', [$entry['id'], 'Hallo', 'feedback']);
    }

    /**
     * A coach of another course cannot read the course portfolios.
     */
    public function test_other_coach(): void {
        $this->setUser($this->otherteacher);
        $this->expectException(\require_login_exception::class);
        $this->call('get_course_portfolios', [$this->course->id, 0]);
    }

    /**
     * Attachments: upload, list, access check, delete.
     */
    public function test_files(): void {
        $this->redirectMessages();
        $entry = $this->draft();
        $file = $this->call('upload_portfolio_file', [$entry['id'], 'plan.txt', base64_encode('Hallo Welt')]);
        $this->assertSame('plan.txt', $file['filename']);
        $this->assertSame(10, $file['filesize']);
        $this->assertStringContainsString('/local_gopilot/portfolio/' . $entry['id'] . '/plan.txt', $file['url']);
        $second = $this->call('upload_portfolio_file', [$entry['id'], 'plan.txt', base64_encode('Zweite Datei')]);
        $this->assertNotSame('plan.txt', $second['filename']);

        $own = $this->call('get_portfolio', [$this->course->id])['entries'][0];
        $this->assertCount(2, $own['files']);
        $this->assertTrue($this->call('delete_portfolio_file', [$entry['id'], $second['id']])['success']);
        $this->assertCount(1, $this->call('get_portfolio', [$this->course->id])['entries'][0]['files']);

        $record = \local_gopilot\local\portfolio::get_entry($entry['id']);
        $this->assertTrue(\local_gopilot\local\portfolio::can_view($record, (int)$this->learner->id));
        $this->assertFalse(\local_gopilot\local\portfolio::can_view($record, (int)$this->teacher->id));
        $this->call('change_portfolio_status', [$entry['id'], 'submit']);
        $record = \local_gopilot\local\portfolio::get_entry($entry['id']);
        $this->assertTrue(\local_gopilot\local\portfolio::can_view($record, (int)$this->teacher->id));
        $this->assertFalse(\local_gopilot\local\portfolio::can_view($record, (int)$this->other->id));

        $this->assert_error('portfolionoedit', 'upload_portfolio_file', [$entry['id'], 'x.txt', base64_encode('x')]);
    }

    /**
     * The service contains the portfolio functions.
     */
    public function test_service_functions(): void {
        global $DB;
        $service = $DB->get_record('external_services', ['shortname' => 'gopilot'], '*', MUST_EXIST);
        $functions = $DB->get_fieldset_select(
            'external_services_functions',
            'functionname',
            'externalserviceid = ?',
            [$service->id]
        );
        $expected = ['get_portfolio', 'save_portfolio_entry', 'change_portfolio_status', 'delete_portfolio_entry',
            'upload_portfolio_file', 'delete_portfolio_file', 'mark_portfolio_read', 'get_course_portfolios',
            'add_portfolio_feedback'];
        foreach ($expected as $name) {
            $this->assertContains('local_gopilot_' . $name, $functions);
        }
    }
}
