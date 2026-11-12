/** Basis-URL der Moodle-Instanz, gesetzt über VITE_MOODLE_URL. */
export const moodleUrl: string = (import.meta.env.VITE_MOODLE_URL ?? '').replace(/\/+$/, '')

/** Default address of the MMBbS Teaching Assistant (https://github.com/Herr-FR/Gopilot_teaching-assistent). */
const DEFAULT_TEACHING_ASSISTANT_URL = 'https://herr-fr.github.io/Gopilot_teaching-assistent/'

/**
 * Address of the Teaching Assistant for teachers, set with VITE_TEACHING_ASSISTANT_URL.
 * Unset = default address, empty (`VITE_TEACHING_ASSISTANT_URL=`) = no menu entry.
 */
export const teachingAssistantUrl: string = (
  import.meta.env.VITE_TEACHING_ASSISTANT_URL ?? DEFAULT_TEACHING_ASSISTANT_URL
).trim()

/** Mock mode (VITE_MOCK=1): answers all calls from in-memory fixtures. */
export function isMockMode(): boolean {
  return import.meta.env.VITE_MOCK === '1'
}
