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
 * German language strings for local_gopilot.
 *
 * @package    local_gopilot
 * @copyright  2026 Jörg Tuttas
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['appurl'] = 'App-Adresse';
$string['appurl_desc'] = 'Adresse der GoPilot-App (z. B. https://gopilot.example.org). Wird für Links in Benachrichtigungen verwendet. Leer = keine Links.';
$string['autologinhttps'] = 'Die automatische Anmeldung in Moodle setzt HTTPS voraus.';
$string['autologinnotforadmins'] = 'Aus Sicherheitsgründen können Administrator/innen nicht automatisch angemeldet werden. Bitte direkt in Moodle anmelden.';
$string['colour_green'] = 'grün';
$string['colour_none'] = 'kein Signal';
$string['colour_red'] = 'rot';
$string['colour_yellow'] = 'gelb';
$string['emptymessage'] = 'Die Nachricht ist leer.';
$string['event_feedback_added'] = 'Coaching-Feedback hinzugefügt';
$string['event_plan_saved'] = 'Wochenplan gespeichert';
$string['event_portfolio_feedback_added'] = 'Rückmeldung zu einem Portfolio-Eintrag gegeben';
$string['event_portfolio_submitted'] = 'Portfolio-Eintrag eingereicht';
$string['event_reflection_saved'] = 'Kursreflexion gespeichert';
$string['gopilot:coach'] = 'Lernende in GoPilot begleiten (Lerncoach)';
$string['gopilot:configure'] = 'GoPilot für einen Kurs konfigurieren';
$string['gopilot:use'] = 'GoPilot als Lernende:r nutzen';
$string['invalidmoodleurl'] = 'Der Link zeigt nicht auf diese Moodle-Website.';
$string['invalidportfoliocategory'] = 'Unbekannte Kategorie für den Portfolio-Eintrag.';
$string['invalidportfoliodate'] = 'Das Datum muss die Form JJJJ-MM-TT haben.';
$string['invalidportfoliolink'] = 'Links müssen mit http:// oder https:// beginnen.';
$string['invalidthresholds'] = 'Ungültige Schwellwerte: Der Wert für Gelb muss unter dem Wert für Grün bzw. Rot liegen.';
$string['invalidweek'] = 'Ungültige Woche „{$a}“: erwartet wird der Montag als JJJJ-MM-TT.';
$string['messageprovider:ampelchange'] = 'Deine GoPilot-Ampel wechselt auf Gelb oder Rot';
$string['messageprovider:feedback'] = 'Neues Coaching-Feedback in GoPilot';
$string['messageprovider:portfolio'] = 'Portfolio-Eintrag eingereicht oder Rückmeldung dazu in GoPilot';
$string['messageprovider:reflection'] = 'Lernende:r hat eine Kursreflexion in GoPilot gespeichert';
$string['messageprovider:reflectiondue'] = 'Erinnerung an die Wochenreflexion in GoPilot';
$string['notalearner'] = 'Die Person ist in diesem Kurs nicht als Lernende:r eingeschrieben.';
$string['notify_ampelchange_body'] = 'Deine Ampel in {$a->course} ist jetzt {$a->colour}: {$a->reasons}. Das ist ein Hinweis, keine Note.';
$string['notify_ampelchange_subject'] = 'GoPilot: Ampel in {$a->course} ist {$a->colour}';
$string['notify_feedback_body'] = '{$a->author} zur KW {$a->kw} in {$a->course}: {$a->message}';
$string['notify_feedback_subject'] = 'Neues Feedback von {$a->author} ({$a->course})';
$string['notify_portfoliofeedback_body'] = '{$a->author} zu „{$a->title}“ ({$a->status}): {$a->message}';
$string['notify_portfoliofeedback_subject'] = 'Rückmeldung zu deinem Portfolio-Eintrag ({$a->course})';
$string['notify_portfolioresubmitted_body'] = '{$a->learner} hat „{$a->title}“ überarbeitet (Version {$a->revision}).';
$string['notify_portfolioresubmitted_subject'] = 'Überarbeiteter Portfolio-Eintrag von {$a->learner} ({$a->course})';
$string['notify_portfoliosubmitted_body'] = '{$a->learner} hat „{$a->title}“ eingereicht.';
$string['notify_portfoliosubmitted_subject'] = 'Neuer Portfolio-Eintrag von {$a->learner} ({$a->course})';
$string['notify_reflection_body'] = '{$a->learner} hat die KW {$a->kw} in {$a->course} reflektiert.';
$string['notify_reflection_subject'] = 'Neue Reflexion von {$a->learner} ({$a->course})';
$string['notify_reflectiondue_body'] = 'Bitte reflektiere die KW {$a->kw} für: {$a->courses}.';
$string['notify_reflectiondue_subject'] = 'GoPilot: Zeit für deine Wochenreflexion';
$string['pluginname'] = 'GoPilot';
$string['portfoliofilenotfound'] = 'Der Anhang wurde nicht gefunden.';
$string['portfoliofiletoobig'] = 'Die Datei ist zu groß.';
$string['portfolioinvalidstatus'] = 'Das geht im aktuellen Status des Eintrags nicht.';
$string['portfolionoedit'] = 'Dieser Eintrag kann nicht mehr geändert werden. Ändern ist nur bei Entwürfen und bei „Bitte überarbeiten“ möglich.';
$string['portfolionotfound'] = 'Der Portfolio-Eintrag wurde nicht gefunden.';
$string['portfoliostatus_done'] = 'abgeschlossen';
$string['portfoliostatus_feedback'] = 'Rückmeldung';
$string['portfoliostatus_revise'] = 'bitte überarbeiten';
$string['portfoliotitlemissing'] = 'Bitte gib einen Titel ein.';
$string['portfoliotoomanyfiles'] = 'Ein Eintrag kann höchstens {$a} Anhänge haben.';
$string['privacy:ampel'] = 'Ampel';
$string['privacy:feedbackgiven'] = 'Gegebenes Feedback';
$string['privacy:metadata:core_files'] = 'Anhänge von Portfolio-Einträgen werden im Moodle-Dateisystem gespeichert.';
$string['privacy:metadata:core_message'] = 'GoPilot verschickt Benachrichtigungen über das Moodle-Mitteilungssystem.';
$string['privacy:metadata:core_userkey'] = 'GoPilot erzeugt kurzlebige Einmalschlüssel, um Personen aus der App heraus in Moodle anzumelden.';
$string['privacy:metadata:local_gopilot_ampel'] = 'Zuletzt berechnete Förder-Ampel pro Lernende:r und Kurs.';
$string['privacy:metadata:local_gopilot_ampel:colour'] = 'Gesamtfarbe.';
$string['privacy:metadata:local_gopilot_ampel:courseid'] = 'Kurs.';
$string['privacy:metadata:local_gopilot_ampel:signals'] = 'Signale mit Werten und Begründungen.';
$string['privacy:metadata:local_gopilot_ampel:timecomputed'] = 'Zeitpunkt der Berechnung.';
$string['privacy:metadata:local_gopilot_ampel:userid'] = 'Lernende:r.';
$string['privacy:metadata:local_gopilot_coursereflection'] = 'Kursreflexionen der Lernenden.';
$string['privacy:metadata:local_gopilot_coursereflection:courseid'] = 'Kurs.';
$string['privacy:metadata:local_gopilot_coursereflection:text'] = 'Reflexionstext.';
$string['privacy:metadata:local_gopilot_coursereflection:timemodified'] = 'Zeitpunkt der Änderung.';
$string['privacy:metadata:local_gopilot_coursereflection:weekid'] = 'Planungswoche.';
$string['privacy:metadata:local_gopilot_feedback'] = 'Coaching-Feedback-Fäden.';
$string['privacy:metadata:local_gopilot_feedback:authorid'] = 'Verfasser:in des Eintrags.';
$string['privacy:metadata:local_gopilot_feedback:courseid'] = 'Kurs.';
$string['privacy:metadata:local_gopilot_feedback:message'] = 'Nachricht.';
$string['privacy:metadata:local_gopilot_feedback:timecreated'] = 'Zeitpunkt der Erstellung.';
$string['privacy:metadata:local_gopilot_feedback:timeread'] = 'Zeitpunkt, zu dem der Eintrag gelesen wurde.';
$string['privacy:metadata:local_gopilot_feedback:weekid'] = 'Planungswoche der:des Lernenden.';
$string['privacy:metadata:local_gopilot_planitem'] = 'In einer Woche geplante Lernschritte.';
$string['privacy:metadata:local_gopilot_planitem:cmid'] = 'Geplante Aktivität.';
$string['privacy:metadata:local_gopilot_planitem:completedatclose'] = 'Abschlussstand am Wochenende.';
$string['privacy:metadata:local_gopilot_planitem:courseid'] = 'Kurs.';
$string['privacy:metadata:local_gopilot_planitem:weekid'] = 'Planungswoche.';
$string['privacy:metadata:local_gopilot_portfolio'] = 'Portfolio-Einträge der Lernenden.';
$string['privacy:metadata:local_gopilot_portfolio:category'] = 'Kategorie.';
$string['privacy:metadata:local_gopilot_portfolio:courseid'] = 'Kurs.';
$string['privacy:metadata:local_gopilot_portfolio:entrydate'] = 'Datum des Eintrags.';
$string['privacy:metadata:local_gopilot_portfolio:fields'] = 'Antworten auf die Leitfragen.';
$string['privacy:metadata:local_gopilot_portfolio:links'] = 'Links.';
$string['privacy:metadata:local_gopilot_portfolio:revision'] = 'Version.';
$string['privacy:metadata:local_gopilot_portfolio:selflevel'] = 'Selbsteinschätzung.';
$string['privacy:metadata:local_gopilot_portfolio:status'] = 'Status.';
$string['privacy:metadata:local_gopilot_portfolio:tags'] = 'Schlagworte.';
$string['privacy:metadata:local_gopilot_portfolio:timecreated'] = 'Zeitpunkt der Erstellung.';
$string['privacy:metadata:local_gopilot_portfolio:timemodified'] = 'Zeitpunkt der Änderung.';
$string['privacy:metadata:local_gopilot_portfolio:timeread'] = 'Zeitpunkt, zu dem die Rückmeldung gelesen wurde.';
$string['privacy:metadata:local_gopilot_portfolio:timesubmitted'] = 'Zeitpunkt des Einreichens.';
$string['privacy:metadata:local_gopilot_portfolio:title'] = 'Titel.';
$string['privacy:metadata:local_gopilot_portfolio:userid'] = 'Lernende:r.';
$string['privacy:metadata:local_gopilot_portfoliofb'] = 'Rückmeldungen der Lerncoaches zu Portfolio-Einträgen.';
$string['privacy:metadata:local_gopilot_portfoliofb:authorid'] = 'Verfasser:in.';
$string['privacy:metadata:local_gopilot_portfoliofb:entryid'] = 'Portfolio-Eintrag.';
$string['privacy:metadata:local_gopilot_portfoliofb:message'] = 'Nachricht.';
$string['privacy:metadata:local_gopilot_portfoliofb:revision'] = 'Version, auf die sich die Rückmeldung bezieht.';
$string['privacy:metadata:local_gopilot_portfoliofb:status'] = 'Gesetzter Status.';
$string['privacy:metadata:local_gopilot_portfoliofb:timecreated'] = 'Zeitpunkt der Erstellung.';
$string['privacy:metadata:local_gopilot_pushsub'] = 'Web-Push-Abos von Geräten.';
$string['privacy:metadata:local_gopilot_pushsub:auth'] = 'Authentifizierungsgeheimnis des Abos.';
$string['privacy:metadata:local_gopilot_pushsub:endpoint'] = 'Adresse des Push-Dienstes für das Gerät.';
$string['privacy:metadata:local_gopilot_pushsub:p256dh'] = 'Öffentlicher Schlüssel des Abos.';
$string['privacy:metadata:local_gopilot_pushsub:timecreated'] = 'Zeitpunkt der Erstellung.';
$string['privacy:metadata:local_gopilot_pushsub:userid'] = 'Person.';
$string['privacy:metadata:local_gopilot_selfassessment'] = 'Selbsteinschätzungen pro Lernpfad.';
$string['privacy:metadata:local_gopilot_selfassessment:courseid'] = 'Kurs.';
$string['privacy:metadata:local_gopilot_selfassessment:remark'] = 'Kommentar.';
$string['privacy:metadata:local_gopilot_selfassessment:sectionid'] = 'Lernpfad.';
$string['privacy:metadata:local_gopilot_selfassessment:selflevel'] = 'Stufe der Selbsteinschätzung.';
$string['privacy:metadata:local_gopilot_selfassessment:weekid'] = 'Planungswoche.';
$string['privacy:metadata:local_gopilot_week'] = 'Planungswochen der Lernenden.';
$string['privacy:metadata:local_gopilot_week:generalreflection'] = 'Allgemeine Reflexion.';
$string['privacy:metadata:local_gopilot_week:goal'] = 'Wochenziel.';
$string['privacy:metadata:local_gopilot_week:reflectedat'] = 'Zeitpunkt der letzten Reflexion.';
$string['privacy:metadata:local_gopilot_week:timemodified'] = 'Zeitpunkt der Änderung.';
$string['privacy:metadata:local_gopilot_week:userid'] = 'Lernende:r.';
$string['privacy:metadata:local_gopilot_week:week'] = 'Montag der Woche.';
$string['privacy:metadata:webpush'] = 'Benachrichtigungen werden verschlüsselt an den Push-Dienst des Browsers (z. B. Google, Mozilla, Apple) übermittelt.';
$string['privacy:metadata:webpush:body'] = 'Text der Benachrichtigung.';
$string['privacy:metadata:webpush:title'] = 'Titel der Benachrichtigung.';
$string['privacy:metadata:webpush:url'] = 'Pfad in der App.';
$string['privacy:portfolio'] = 'Portfolio';
$string['privacy:portfoliofeedbackgiven'] = 'Gegebene Portfolio-Rückmeldungen';
$string['privacy:pushsubscriptions'] = 'Push-Abos';
$string['pushheading'] = 'Web-Push';
$string['pushheading_desc'] = 'VAPID-Schlüssel für Push-Benachrichtigungen an die App. Erzeugen mit <code>php local/gopilot/cli/generate_vapid.php</code>.';
$string['reflectionclosed'] = 'Diese Woche kann nicht mehr reflektiert werden. Reflektieren ist für die aktuelle und die vorige Woche möglich.';
$string['selflevel1'] = 'sicher';
$string['selflevel2'] = 'geht so';
$string['selflevel3'] = 'unsicher';
$string['selflevel4'] = 'komme nicht klar';
$string['signal_backlog_alldone'] = 'Alle {$a} fälligen Lernschritte erledigt';
$string['signal_backlog_nocompletion'] = 'Abschlussverfolgung ist im Kurs nicht aktiviert';
$string['signal_backlog_none'] = 'Noch kein Soll-Termin abgelaufen';
$string['signal_backlog_onedone'] = 'Der fällige Lernschritt ist erledigt';
$string['signal_backlog_oneopen'] = 'Der fällige Lernschritt ist noch offen';
$string['signal_backlog_reason'] = '{$a->open} von {$a->due} fälligen Lernschritten noch offen';
$string['signal_plan_nothingplanned'] = 'Kein Lernschritt dieses Kurses geplant';
$string['signal_plan_reason'] = '{$a->done} von {$a->total} geplanten Lernschritten erledigt ({$a->percent} %)';
$string['signal_reflection_noplannedweek'] = 'Noch keine abgeschlossene Woche mit geplanten Lernschritten';
$string['signal_reflection_one'] = 'Kursreflexion der letzten geplanten Woche fehlt';
$string['signal_reflection_present'] = 'Kursreflexion der letzten geplanten Woche vorhanden';
$string['signal_reflection_reason'] = 'Kursreflexion fehlt in {$a} geplanten Wochen in Folge';
$string['signal_selfassessment_none'] = 'Noch keine Selbsteinschätzung';
$string['signal_selfassessment_reason'] = 'Selbsteinschätzung „{$a->level}“ in {$a->path} (KW {$a->kw})';
$string['task_freeze_weeks'] = 'Abschlussstand abgeschlossener GoPilot-Wochen einfrieren';
$string['task_recalculate_ampel'] = 'GoPilot-Ampeln neu berechnen';
$string['task_reflection_due'] = 'Lernende an die Reflexion erinnern (GoPilot)';
$string['vapidprivatekey'] = 'Privater VAPID-Schlüssel';
$string['vapidprivatekey_desc'] = 'Privater Schlüssel (Base64-URL, 32 Byte). Geheim halten.';
$string['vapidpublickey'] = 'Öffentlicher VAPID-Schlüssel';
$string['vapidpublickey_desc'] = 'Öffentlicher Schlüssel (Base64-URL, unkomprimierter P-256-Punkt). Die App abonniert damit.';
$string['vapidsubject'] = 'VAPID-Kontakt';
$string['vapidsubject_desc'] = 'Kontakt für Push-Dienste, mailto:- oder https:-Adresse. Leer = Website-Adresse (https) oder No-Reply-Adresse.';
$string['weekclosed'] = 'Diese Woche ist abgeschlossen und kann nicht mehr geplant werden.';
