import {
  IconAward,
  IconBook,
  IconBulb,
  IconFileText,
  IconMessages,
  IconMoodSmile,
  IconTarget,
  type Icon,
} from '@tabler/icons-react'
import type { PortfolioCategory, PortfolioEntry, PortfolioField, PortfolioStatus } from '../api/types'

export interface PortfolioQuestion {
  /** Key stored in `fields` (docs/api-v1.md, portfolioentry). */
  key: string
  label: string
  placeholder: string
  /** Single-line input instead of a text area. */
  short?: boolean
}

export interface PortfolioCategoryInfo {
  key: PortfolioCategory
  /** Plural, for the register. */
  label: string
  /** Singular, for badges and the editor. */
  one: string
  icon: Icon
  /** Mantine colour (no red, yellow or teal: they carry Ampel meaning). */
  color: string
  hint: string
  /** Ask for a self-assessment. */
  selfassessment: boolean
  questions: PortfolioQuestion[]
}

/** The registers of the portfolio with their guiding questions. */
export const PORTFOLIO_CATEGORIES: PortfolioCategoryInfo[] = [
  {
    key: 'ergebnis',
    label: 'Arbeitsergebnisse',
    one: 'Arbeitsergebnis',
    icon: IconFileText,
    color: 'blue',
    hint: 'Deine Produkte aus Lernsituationen und Arbeitsaufträgen: Konzepte, Präsentationen, Code, Grafiken …',
    selfassessment: true,
    questions: [
      { key: 'auftrag', label: 'Arbeitsauftrag / Lernsituation', placeholder: 'z. B. LS 5.2 – Datenbank entwerfen', short: true },
      { key: 'beschreibung', label: 'Was habe ich erstellt?', placeholder: 'Beschreibe dein Ergebnis in 2–4 Sätzen.' },
      { key: 'vorgehen', label: 'Wie bin ich vorgegangen?', placeholder: 'Informieren · Planen · Durchführen · Kontrollieren · Bewerten' },
      { key: 'anteil', label: 'Mein Anteil (bei Gruppenarbeit)', placeholder: 'Mit wem hast du gearbeitet? Was war dein Teil?' },
    ],
  },
  {
    key: 'reflexion',
    label: 'Reflexionsbögen',
    one: 'Reflexion',
    icon: IconMoodSmile,
    color: 'indigo',
    hint: 'Schau zurück: Was hast du gelernt, was lief gut, was nimmst du dir vor?',
    selfassessment: true,
    questions: [
      { key: 'gelernt', label: 'Was habe ich gelernt?', placeholder: 'Ich habe gelernt, dass …' },
      { key: 'gut', label: 'Was lief gut?', placeholder: 'Gut lief …, weil …' },
      { key: 'schwierig', label: 'Was war schwierig – und warum?', placeholder: 'Schwierig war für mich …' },
      { key: 'hilfe', label: 'Was oder wer hat mir geholfen?', placeholder: 'Geholfen hat mir …' },
      { key: 'naechstes', label: 'Was nehme ich mir für das nächste Mal vor?', placeholder: 'Beim nächsten Mal werde ich …' },
    ],
  },
  {
    key: 'strategie',
    label: 'Lernstrategien',
    one: 'Lernstrategie',
    icon: IconBulb,
    color: 'grape',
    hint: 'Sammle Strategien, die du ausprobiert hast – und wie gut sie für dich funktionieren.',
    selfassessment: false,
    questions: [
      { key: 'strategie', label: 'Welche Lernstrategie habe ich genutzt?', placeholder: 'z. B. Karteikarten, Mindmap, Feynman-Methode', short: true },
      { key: 'situation', label: 'In welcher Situation habe ich sie eingesetzt?', placeholder: 'Ich habe sie genutzt, als …' },
      { key: 'wirkung', label: 'Wie gut hat sie funktioniert?', placeholder: 'Sie hat mir geholfen, weil … / nicht geholfen, weil …' },
      { key: 'weiter', label: 'Behalte ich sie bei? Was passe ich an?', placeholder: 'Ich werde …' },
    ],
  },
  {
    key: 'ziel',
    label: 'Lernziele',
    one: 'Lernziel',
    icon: IconTarget,
    color: 'cyan',
    hint: 'Längerfristige Ziele über die Wochenziele hinaus: konkret, überprüfbar, mit Schritten.',
    selfassessment: true,
    questions: [
      { key: 'ziel', label: 'Mein Lernziel', placeholder: 'Ich kann … (konkret und überprüfbar)' },
      { key: 'bis', label: 'Bis wann?', placeholder: 'z. B. Ende des Blocks', short: true },
      { key: 'schritte', label: 'Meine nächsten Schritte', placeholder: '1. …  2. …  3. …' },
      { key: 'merkmal', label: 'Woran merke ich, dass ich es erreicht habe?', placeholder: 'Ich habe mein Ziel erreicht, wenn …' },
    ],
  },
  {
    key: 'feedback',
    label: 'Feedback erhalten',
    one: 'Feedback',
    icon: IconMessages,
    color: 'orange',
    hint: 'Halte Rückmeldungen fest – von Mitlernenden, aus dem Betrieb oder von Lehrkräften.',
    selfassessment: false,
    questions: [
      { key: 'von', label: 'Von wem?', placeholder: 'z. B. Peer-Feedback der Lerngruppe, Ausbilderin im Betrieb', short: true },
      { key: 'inhalt', label: 'Was wurde mir zurückgemeldet?', placeholder: 'Mir wurde gesagt, dass …' },
      { key: 'umgang', label: 'Was mache ich damit?', placeholder: 'Ich werde …' },
    ],
  },
  {
    key: 'tagebuch',
    label: 'Lerntagebuch',
    one: 'Tagebucheintrag',
    icon: IconBook,
    color: 'violet',
    hint: 'Kurze, regelmäßige Notizen zu deinem Lernen.',
    selfassessment: false,
    questions: [
      { key: 'heute', label: 'Was habe ich gemacht?', placeholder: '' },
      { key: 'erkenntnis', label: 'Meine wichtigste Erkenntnis', placeholder: '' },
      { key: 'frage', label: 'Was ist noch offen?', placeholder: '' },
    ],
  },
  {
    key: 'nachweis',
    label: 'Nachweise & Zertifikate',
    one: 'Nachweis',
    icon: IconAward,
    color: 'pink',
    hint: 'Zertifikate, Teilnahmebestätigungen, Badges, Praktikumsnachweise.',
    selfassessment: false,
    questions: [
      { key: 'art', label: 'Art des Nachweises', placeholder: 'z. B. Cisco-Zertifikat, Erste-Hilfe-Kurs', short: true },
      { key: 'beschreibung', label: 'Beschreibung', placeholder: 'Was weist dieser Nachweis nach?' },
    ],
  },
]

export function categoryInfo(key: string): PortfolioCategoryInfo {
  return PORTFOLIO_CATEGORIES.find((c) => c.key === key) ?? PORTFOLIO_CATEGORIES[0]
}

/** Suggestions for the strategy name. */
export const LEARNING_STRATEGIES = [
  'Karteikarten / Wiederholen in Abständen',
  'Mindmap',
  'Feynman-Methode (einfach erklären)',
  'Selbsttest / Abfragen',
  'Zusammenfassung schreiben',
  'Visualisierung / Sketchnotes',
  'Pomodoro-Technik',
  'Lernen mit Beispielen',
  'Lernpartner / Lerngruppe',
  'Fragen an den Text stellen',
  'KI als Lernpartner (Ergebnisse kritisch prüfen)',
]

/** Display of a status for learners and coaches. */
export const PORTFOLIO_STATUS: Record<PortfolioStatus, { label: string; coachLabel: string; color: string }> = {
  draft: { label: 'Entwurf · noch nicht eingereicht', coachLabel: 'Entwurf', color: 'gray' },
  submitted: { label: 'Eingereicht', coachLabel: 'Neu eingereicht', color: 'blue' },
  feedback: { label: 'Rückmeldung erhalten', coachLabel: 'Rückmeldung gegeben', color: 'indigo' },
  revise: { label: 'Bitte überarbeiten', coachLabel: 'Zur Überarbeitung', color: 'orange' },
  done: { label: 'Abgeschlossen', coachLabel: 'Abgeschlossen', color: 'green' },
}

/** The learner may change the entry. */
export function isEditable(entry: Pick<PortfolioEntry, 'status'>): boolean {
  return entry.status === 'draft' || entry.status === 'revise'
}

/** Answer to a guiding question. */
export function fieldValue(fields: PortfolioField[], key: string): string {
  return fields.find((f) => f.key === key)?.value ?? ''
}

/** First non-empty answer, for previews. */
export function excerpt(entry: PortfolioEntry): string {
  for (const q of categoryInfo(entry.category).questions) {
    const v = fieldValue(entry.fields, q.key)
    if (v) return v
  }
  return entry.fields.find((f) => f.value)?.value ?? ''
}

/** 'YYYY-MM-DD' -> 'DD.MM.YYYY'. */
export function formatEntryDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : ''
}

/** Bytes -> '12 KB', '3,4 MB'. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toLocaleString('de-DE', { maximumFractionDigits: 1 })} MB`
}

/** File content as Base64 without the data: prefix (for local_gopilot_upload_portfolio_file). */
export function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Datei konnte nicht gelesen werden'))
    reader.readAsDataURL(file)
  })
}

/** Only http(s) links are accepted by the plugin. */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}
