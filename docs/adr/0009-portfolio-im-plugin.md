# ADR 0009: Portfolio als Mappe pro Kurs im Plugin, Anhänge im Moodle-Dateisystem

- Status: vorgeschlagen
- Datum: 2026-11-12

## Kontext

Lernende sollen neben Wochenplan und Reflexion eine **Portfoliomappe** führen: Arbeitsergebnisse, Reflexionsbögen, Lernstrategien, längerfristige Lernziele, erhaltenes Feedback, Lerntagebuch und Nachweise. Der Lerncoach soll die Einträge einsehen und eine Rückmeldung geben. Wie alle GoPilot-Daten sollen sie in Moodle liegen (ADR 0001).

Offen waren drei Fragen: Woran hängt ein Eintrag (Person, Kurs, Woche)? Wer sieht ihn wann? Wie kommen Dateien nach Moodle, ohne dass die App weitere Moodle-Endpunkte braucht als die in ADR 0007 geprüften?

## Entscheidung

- Ein Portfolio-Eintrag gehört **einer:einem Lernenden und einem Kurs**, nicht einer Woche. Lerncoach ist damit wie überall die Kurslehrkraft (ADR 0004).
- Ein Eintrag ist zuerst **Entwurf** und wird erst durch **Einreichen** für die Lerncoaches des Kurses sichtbar. Status danach: eingereicht, Rückmeldung, bitte überarbeiten, abgeschlossen. Bei „bitte überarbeiten“ darf die:der Lernende wieder ändern und erneut einreichen (Version + 1).
- Entwürfe liefert das Plugin nicht an Lerncoaches aus. Die App nennt sie trotzdem „noch nicht eingereicht“ und nicht „privat“, weil GoPilot keine Privatheit verspricht (CONTEXT.md).
- Die Selbsteinschätzung im Eintrag nutzt dieselbe vierstufige Skala wie die Reflexion. Sie fließt **nicht** in die Förder-Ampel ein.
- Antworten auf die Leitfragen werden als Schlüssel-Wert-Paare gespeichert. Die Leitfragen selbst definiert die App (`app/src/lib/portfolio.ts`), damit sie ohne Plugin-Update angepasst werden können.
- **Anhänge** liegen im Moodle-Dateisystem (Kurskontext, Dateibereich `portfolio`). Die App lädt sie Base64-kodiert über eine eigene Webservice-Funktion hoch, nicht über `webservice/upload.php`. So bleibt es bei den CORS-fähigen Endpunkten aus ADR 0007. Angezeigt werden sie über `pluginfile.php` mit einer Moodle-Sitzung aus `local_gopilot_get_moodle_link`.

## Verworfene Alternativen

- **Moodle-Kernaktivitäten (Datenbank, Aufgabe, Exabis ePortfolio):** keine einheitliche Oberfläche in GoPilot, Einrichtung pro Kurs nötig, Rückmeldung und Status nur umständlich abbildbar.
- **`webservice/upload.php` und Entwurfsbereich:** für die App-Domain nicht auf CORS geprüft und braucht `uploadfiles` im Dienst.
- **Eintrag pro Woche:** Portfolio-Einträge entstehen oft über mehrere Wochen und passen nicht zur Planungswoche.

## Folgen

- Base64 vergrößert Uploads um ein Drittel. Das Plugin begrenzt Anhänge auf 10 MB, auf die Moodle-Upload-Grenze des Kurses und auf rund drei Viertel von `post_max_size`; die App zeigt die Grenze vorab.
- Der Datenschutz-Provider exportiert und löscht Einträge, Rückmeldungen und Anhänge im Kurskontext.
- Neuer Message-Provider `portfolio` für eingereichte Einträge (an Lerncoaches) und Rückmeldungen (an Lernende).
