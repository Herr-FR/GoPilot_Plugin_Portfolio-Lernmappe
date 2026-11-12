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
    hint: 'Kurze, regelmäßige Notizen zu deinem Lernen, zum Beispiel nach dem Check-out am Ende der Stunde.',
    selfassessment: false,
    // Same questions as the check-out of the MMBbS Teaching Assistant.
    questions: [
      { key: 'heute', label: 'Was haben wir heute gemacht?', placeholder: 'Thema, Aufgabe, Lernsituation …' },
      { key: 'lichtblick', label: 'Lichtblicke', placeholder: 'Was war heute richtig gut? Wem möchtest du danken?' },
      { key: 'erkenntnis', label: 'Das nehme ich mit', placeholder: 'Was habe ich heute gelernt, das ich behalten und anwenden will?' },
      { key: 'frage', label: 'Das ist mir noch unklar', placeholder: 'Welche Frage ist für mich heute offen geblieben?' },
      { key: 'vertiefen', label: 'Damit will ich mich intensiver auseinandersetzen', placeholder: 'Welches Thema möchte ich vertiefen, und warum?' },
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

export interface LearningStrategy {
  name: string
  text: string
  /** Source with more information, '' = none. */
  link: string
}

const LS_URL = 'https://www.learningscientists.org/downloadable-materials'

/**
 * Learning strategies, the same list as in the MMBbS Teaching Assistant (Lernstrategie des Tages),
 * so that a strategy from the check-in can be recorded in the portfolio by name.
 */
export const LEARNING_STRATEGIES: LearningStrategy[] = [
  { name: 'Verteiltes Lernen', text: 'Lerne lieber mehrmals kurz als einmal lange. Wiederhole den Stoff nach einem Tag, nach einer Woche und noch einmal vor der Prüfung.', link: LS_URL },
  { name: 'Abrufübung', text: 'Klapp deine Unterlagen zu und schreib auf, was du noch weißt. Erst danach vergleichst du und ergänzt, was gefehlt hat. Das Erinnern selbst festigt das Wissen.', link: 'https://www.th-koeln.de/mam/downloads/deutsch/studium/rundumsstudium/schluesselkompetenzen/arbeitstechniken_testeffekt.pdf' },
  { name: 'Warum-Fragen stellen', text: 'Frag dich bei jedem neuen Inhalt: Warum ist das so? Wie hängt das mit dem zusammen, was ich schon weiß? Beantworte die Fragen in eigenen Worten.', link: LS_URL },
  { name: 'Gemischt üben', text: 'Übe verschiedene Aufgabentypen durcheinander statt immer denselben Typ hintereinander. So lernst du zu erkennen, welcher Lösungsweg wann passt.', link: LS_URL },
  { name: 'Konkrete Beispiele', text: 'Such zu jedem Fachbegriff ein eigenes Beispiel aus deinem Alltag oder deinem Betrieb. Erkläre, was genau an diesem Beispiel typisch ist.', link: LS_URL },
  { name: 'Wort und Bild verbinden', text: 'Zeichne zu einem Inhalt eine Skizze, ein Schaubild oder eine Zeitleiste und erkläre sie in Worten. Bild und Text zusammen bleiben besser im Kopf.', link: LS_URL },
  { name: 'Lernkartei', text: 'Schreib Fragen auf Karteikarten. Gewusste Karten wandern ein Fach weiter und kommen seltener dran, nicht gewusste wandern zurück ins erste Fach.', link: '' },
  { name: 'SQ3R-Lesemethode', text: 'Verschaff dir einen Überblick, stell Fragen an den Text, lies gezielt, gib das Gelesene in eigenen Worten wieder und wiederhole es. So liest du Fachtexte mit einem Ziel.', link: 'https://uni-jena.de/unijenamedia/325182/sq3r-methode-texte-effektiv-lesen.pdf' },
  { name: 'Lernen durch Erklären', text: 'Erkläre den Inhalt einer Mitschülerin oder einem Mitschüler so, dass er ohne Vorwissen verständlich ist. Wo du ins Stocken kommst, steckt eine Lücke.', link: '' },
  { name: 'Pomodoro-Technik', text: 'Arbeite 25 Minuten konzentriert an einer Aufgabe, das Handy liegt weg. Dann folgen 5 Minuten Pause. Nach vier Runden machst du eine längere Pause.', link: 'https://www.owl.tu-darmstadt.de/media/owl/schreibtechniken_und__uebungen/Pomodoro-Technik.pdf' },
  { name: 'Mindmap', text: 'Schreib das Thema in die Mitte und ordne die Unterbegriffe als Äste darum. So siehst du Zusammenhänge auf einen Blick und merkst, wo noch etwas fehlt.', link: '' },
  { name: 'In drei Sätzen zusammenfassen', text: 'Fass einen Abschnitt in drei Sätzen zusammen, ohne in den Text zu schauen. Gelingt es in eigenen Worten, hast du ihn verstanden.', link: '' },
]

/** Strategy of the list by name (case-insensitive), undefined for own strategies. */
export function strategyByName(name: string): LearningStrategy | undefined {
  const n = name.trim().toLowerCase()
  return n ? LEARNING_STRATEGIES.find((s) => s.name.toLowerCase() === n) : undefined
}

/** Values to pre-fill a new entry, e.g. from a QR code of the Teaching Assistant. */
export interface PortfolioPrefill {
  category: PortfolioCategory
  title: string
  answers: Record<string, string>
  /** Description of a strategy that is not in LEARNING_STRATEGIES. */
  strategyText: string
}

/** Query parameters of a pre-filled new entry (see docs/anleitung/app-gopilot.md). */
export const PREFILL_PARAMS = ['neu', 'name', 'text', 'titel'] as const

function todayLabel(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

/**
 * Reads `?neu=<category>&name=<strategy>&text=<description>&titel=<title>`.
 * Returns null without a valid category. Values are cut to the plugin's limits.
 */
export function parsePrefill(params: URLSearchParams): PortfolioPrefill | null {
  const key = params.get('neu') ?? ''
  if (!PORTFOLIO_CATEGORIES.some((c) => c.key === key)) return null
  const category = key as PortfolioCategory
  const name = (params.get('name') ?? '').trim().slice(0, 255)
  const text = (params.get('text') ?? '').trim().slice(0, 1000)
  let title = (params.get('titel') ?? '').trim().slice(0, 255)
  const answers: Record<string, string> = {}
  let strategyText = ''
  if (category === 'strategie' && name) {
    const known = strategyByName(name)
    answers.strategie = known?.name ?? name
    if (!known) strategyText = text
    if (!title) title = `Lernstrategie: ${answers.strategie}`
  }
  if (category === 'tagebuch' && !title) title = `Check-out ${todayLabel()}`
  return { category, title, answers, strategyText }
}

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
