// Mock backend for VITE_MOCK=1. Implements the contract in docs/api-v1.md
// (including the Ampel rules) on top of the in-memory fixtures, and answers
// with the same JSON shapes Moodle would, including `exception` objects.

import type { Params, ParamValue } from '../serialize'
import type {
  Ampel,
  AmpelColour,
  CourseWeek,
  FeedbackEntry,
  LearnerWeek,
  Meta,
  PortfolioEntry,
  Signal,
  Step,
  Thresholds,
  Week,
} from '../types'
import { addWeeks, isMonday, isoWeek } from '../../lib/week'
import { moodleUrl } from '../../config'
import { selfAssessmentLabel } from '../../lib/ampel'
import {
  createMockDb,
  dayTime,
  DEFAULT_THRESHOLDS,
  emptyMockWeek,
  type MockCourse,
  type MockDb,
  type MockPortfolioEntry,
  type MockStep,
  type MockWeekData,
} from './fixtures'

let db: MockDb = createMockDb()

/** Every call, for assertions in tests. */
export const mockRequests: { wsfunction: string; params: Params; userid: number }[] = []

export function resetMock(today?: Date): void {
  db = createMockDb(today)
  mockRequests.length = 0
}

export function getMockDb(): MockDb {
  return db
}

class MockException extends Error {
  readonly errorcode: string
  constructor(errorcode: string, message: string) {
    super(message)
    this.errorcode = errorcode
  }
}

const delay = () =>
  new Promise((r) => setTimeout(r, import.meta.env.MODE === 'test' ? 0 : 150))

export async function mockLogin(username: string, password: string): Promise<unknown> {
  await delay()
  const user = db.users.find((u) => u.username === username.trim().toLowerCase())
  if (!user || !password || password === 'falsch') {
    return { error: 'Ungültige Anmeldedaten', errorcode: 'invalidlogin' }
  }
  return { token: `mock-${user.id}` }
}

export async function mockCall(wsfunction: string, params: Params, token: string): Promise<unknown> {
  await delay()
  const userid = Number(token.replace(/^mock-/, ''))
  if (!db.users.some((u) => u.id === userid)) {
    return { exception: 'moodle_exception', errorcode: 'invalidtoken', message: 'Ungültiges Token – Token nicht gefunden' }
  }
  mockRequests.push({ wsfunction, params: structuredClone(params), userid })
  const handler = handlers[wsfunction]
  if (!handler) {
    return { exception: 'webservice_access_exception', errorcode: 'accessexception', message: `Funktion ${wsfunction} nicht im Dienst` }
  }
  try {
    // Round-trip through JSON like a real response.
    return JSON.parse(JSON.stringify(handler(userid, params)))
  } catch (e) {
    if (e instanceof MockException) {
      return { exception: 'moodle_exception', errorcode: e.errorcode, message: e.message }
    }
    throw e
  }
}

// ---------------------------------------------------------------- helpers

const num = (v: ParamValue): number => Number(v ?? 0)
const str = (v: ParamValue): string => (v === null || v === undefined ? '' : String(v))
const list = (v: ParamValue): ParamValue[] => (Array.isArray(v) ? v : [])
const bool = (v: ParamValue): boolean => v === true || v === 1 || v === '1'

function course(id: number): MockCourse {
  const c = db.courses.find((x) => x.id === id)
  if (!c) throw new MockException('invalidrecord', 'Kurs nicht gefunden')
  return c
}

function allSteps(c: MockCourse): MockStep[] {
  return c.sections.flatMap((s) => s.steps)
}

function findStep(cmid: number): { course: MockCourse; step: MockStep } | undefined {
  for (const c of db.courses) {
    const s = allSteps(c).find((x) => x.cmid === cmid)
    if (s) return { course: c, step: s }
  }
  return undefined
}

function meta(key: string): Meta {
  return db.meta[key] ?? { phase: '', duration: 0, level: 0 }
}

/** End of a week (Sunday 23:59:59) in unix seconds. */
function weekEnd(week: string): number {
  return dayTime(week, 7, 0) - 1
}

function isClosed(week: string): boolean {
  return db.now() > weekEnd(week)
}

function expectedTime(s: MockStep): number {
  return s.expectedOffset === null ? 0 : dayTime(db.currentWeek, s.expectedOffset, 23)
}

/** Completion state, optionally frozen at the end of a closed week. */
function isCompleted(userid: number, cmid: number, frozenAt?: number): boolean {
  const time = db.completions[userid]?.[cmid]
  if (!time) return false
  return frozenAt === undefined || time <= frozenAt
}

function toStep(userid: number, c: MockCourse, s: MockStep, frozenAt?: number): Step {
  const completed = isCompleted(userid, s.cmid, frozenAt)
  const expected = expectedTime(s)
  return {
    cmid: s.cmid,
    courseid: c.id,
    sectionid: s.sectionid,
    name: s.name,
    modname: s.modname,
    url: `${moodleUrl || 'https://moodle.example.org'}/mod/${s.modname}/view.php?id=${s.cmid}`,
    tracked: true,
    completed,
    manual: s.manual,
    expected,
    overdue: expected > 0 && expected < db.now() && !completed,
    meta: meta(`c${s.cmid}`),
  }
}

function canUse(userid: number, c: MockCourse) {
  return c.learners.includes(userid)
}
function canCoach(userid: number, c: MockCourse) {
  return c.coaches.includes(userid)
}

function requireCoach(userid: number, courseid: number): MockCourse {
  const c = course(courseid)
  if (!canCoach(userid, c)) throw new MockException('nopermissions', 'Keine Berechtigung für diesen Kurs')
  return c
}

function requireWeek(week: string) {
  if (!isMonday(week)) throw new MockException('invalidweek', 'Die Woche muss ein Montag sein.')
}

function weekData(userid: number, week: string): MockWeekData | undefined {
  return db.weeks[userid]?.[week]
}

function ensureWeek(userid: number, week: string): MockWeekData {
  db.weeks[userid] ??= {}
  db.weeks[userid][week] ??= emptyMockWeek()
  return db.weeks[userid][week]
}

function hasData(w: MockWeekData | undefined): w is MockWeekData {
  return !!w && (w.cmids.length > 0 || w.goal !== '' || w.reflectedat > 0)
}

function feedbackFor(userid: number, courseid: number, week: string): FeedbackEntry[] {
  return db.feedback
    .filter((f) => f.userid === userid && f.courseid === courseid && f.week === week)
    .sort((a, b) => a.timecreated - b.timecreated)
    .map((f) => ({
      id: f.id,
      authorid: f.authorid,
      authorname: db.users.find((u) => u.id === f.authorid)?.fullname ?? '',
      isteacher: f.authorid !== f.userid,
      message: f.message,
      timecreated: f.timecreated,
      timeread: f.timeread,
    }))
}

/** Unread entries by others in the learner's own weeks, newest first (get_overview.newfeedback). */
function newFeedbackFor(userid: number) {
  return db.feedback
    .filter((f) => f.userid === userid && f.authorid !== userid && f.timeread === 0)
    .filter((f) => db.courses.some((c) => c.id === f.courseid && canUse(userid, c)))
    .sort((a, b) => b.timecreated - a.timecreated || b.id - a.id)
    .map((f) => ({
      id: f.id,
      courseid: f.courseid,
      coursename: course(f.courseid).fullname,
      week: f.week,
      authorname: db.users.find((u) => u.id === f.authorid)?.fullname ?? '',
      message: f.message,
      timecreated: f.timecreated,
    }))
}

function planItems(userid: number, week: string, w: MockWeekData | undefined, courseid?: number): Step[] {
  const frozen = isClosed(week) ? weekEnd(week) : undefined
  return (w?.cmids ?? [])
    .map((cmid) => findStep(cmid))
    .filter((x): x is { course: MockCourse; step: MockStep } => !!x)
    .filter((x) => courseid === undefined || x.course.id === courseid)
    .map((x) => toStep(userid, x.course, x.step, frozen))
}

function selfAssessmentsFor(c: MockCourse, w: MockWeekData | undefined) {
  const planned = new Set(
    (w?.cmids ?? []).map((cmid) => findStep(cmid)).filter((x) => x?.course.id === c.id).map((x) => x!.step.sectionid),
  )
  const saved = w?.selfassessments[c.id] ?? {}
  for (const id of Object.keys(saved)) planned.add(Number(id))
  return c.sections
    .filter((s) => planned.has(s.id))
    .map((s) => ({
      sectionid: s.id,
      name: s.name,
      level: saved[s.id]?.level ?? 0,
      comment: saved[s.id]?.comment ?? '',
    }))
}

function buildWeek(userid: number, week: string): Week {
  const w = weekData(userid, week)
  const courses: CourseWeek[] = db.courses
    .filter((c) => canUse(userid, c))
    .map((c) => ({
      courseid: c.id,
      fullname: c.fullname,
      reflection: w?.reflections[c.id] ?? '',
      selfassessments: selfAssessmentsFor(c, w),
      feedback: feedbackFor(userid, c.id, week),
    }))
  return {
    week,
    closed: isClosed(week),
    goal: w?.goal ?? '',
    generalreflection: w?.generalreflection ?? '',
    reflectedat: w?.reflectedat ?? 0,
    items: planItems(userid, week, w),
    courses,
  }
}

function thresholdsOf(c: MockCourse): Thresholds {
  return c.usedefaults ? { ...DEFAULT_THRESHOLDS } : { ...c.thresholds }
}

function colourAtLeast(value: number, yellow: number, red: number): AmpelColour {
  if (value >= red) return 'red'
  if (value >= yellow) return 'yellow'
  return 'green'
}

/** Ampel rules from api-v1.md, section "Ampel-Regeln". */
function computeAmpel(userid: number, c: MockCourse): Ampel {
  const th = thresholdsOf(c)
  const lastClosed = addWeeks(db.currentWeek, -1)
  const signals: Signal[] = []

  // 1. plan
  const w = weekData(userid, lastClosed)
  const planned = planItems(userid, lastClosed, w, c.id)
  if (planned.length === 0) {
    signals.push({ key: 'plan', active: false, colour: 'none', value: 0, reason: 'Kein Lernschritt dieses Kurses geplant' })
  } else {
    const done = planned.filter((s) => s.completed).length
    const pct = Math.round((done / planned.length) * 100)
    const colour: AmpelColour = pct >= th.plangreen ? 'green' : pct >= th.planyellow ? 'yellow' : 'red'
    signals.push({ key: 'plan', active: true, colour, value: pct, reason: `${done} von ${planned.length} geplanten Lernschritten erledigt (${pct} %)` })
  }

  // 2. backlog
  const steps = allSteps(c).map((s) => toStep(userid, c, s))
  const due = steps.filter((s) => s.tracked && s.expected > 0 && s.expected < db.now()).length
  const overdue = steps.filter((s) => s.overdue).length
  signals.push({
    key: 'backlog',
    active: true,
    colour: colourAtLeast(overdue, th.backlogyellow, th.backlogred),
    value: overdue,
    reason:
      due === 0
        ? 'Noch kein Soll-Termin abgelaufen'
        : due === 1
          ? overdue
            ? 'Der fällige Lernschritt ist noch offen'
            : 'Der fällige Lernschritt ist erledigt'
        : overdue === 0
          ? `Alle ${due} fälligen Lernschritte erledigt`
          : `${overdue} von ${due} fälligen Lernschritten noch offen`,
  })

  // 3. reflection
  // Only closed weeks in which steps of this course were planned count (ADR 0008).
  const plannedWeeks = Object.keys(db.weeks[userid] ?? {})
    .filter((wk) => isClosed(wk) && planItems(userid, wk, weekData(userid, wk), c.id).length > 0)
    .sort()
    .reverse()
  if (plannedWeeks.length === 0) {
    signals.push({
      key: 'reflection',
      active: false,
      colour: 'none',
      value: 0,
      reason: 'Noch keine abgeschlossene Woche mit geplanten Lernschritten',
    })
  } else {
    let missing = 0
    for (const wk of plannedWeeks) {
      if (weekData(userid, wk)?.reflections[c.id]) break
      missing++
    }
    signals.push({
      key: 'reflection',
      active: true,
      colour: colourAtLeast(missing, th.reflectionyellow, th.reflectionred),
      value: missing,
      reason:
        missing === 0
          ? 'Kursreflexion der letzten geplanten Woche vorhanden'
          : missing === 1
            ? 'Kursreflexion der letzten geplanten Woche fehlt'
            : `Kursreflexion fehlt in ${missing} geplanten Wochen in Folge`,
    })
  }

  // 4. selfassessment
  const weeksWithSa = Object.entries(db.weeks[userid] ?? {})
    .filter(([, d]) => Object.values(d.selfassessments[c.id] ?? {}).some((s) => s.level > 0))
    .sort(([a], [b]) => (a < b ? 1 : -1))
  if (weeksWithSa.length === 0) {
    signals.push({ key: 'selfassessment', active: false, colour: 'none', value: 0, reason: 'Noch keine Selbsteinschätzung' })
  } else {
    const [wk, d] = weeksWithSa[0]
    const entries = Object.entries(d.selfassessments[c.id]).filter(([, s]) => s.level > 0)
    const [sectionid, worst] = entries.reduce((a, b) => (b[1].level > a[1].level ? b : a))
    const section = c.sections.find((s) => s.id === Number(sectionid))
    const short = section?.name.match(/^LS\s*\S+/)?.[0] ?? section?.name ?? ''
    const colour: AmpelColour = worst.level >= 4 ? 'red' : worst.level === 3 ? 'yellow' : 'green'
    signals.push({
      key: 'selfassessment',
      active: true,
      colour,
      value: worst.level,
      reason: `Selbsteinschätzung „${selfAssessmentLabel(worst.level)}“ in ${short} (KW ${isoWeek(wk).week})`,
    })
  }

  const rank: Record<AmpelColour, number> = { none: 0, green: 1, yellow: 2, red: 3 }
  const colour = signals
    .filter((s) => s.active)
    .reduce<AmpelColour>((acc, s) => (rank[s.colour] > rank[acc] ? s.colour : acc), 'none')
  return { courseid: c.id, colour, timecomputed: db.now(), signals }
}

const noAmpel = (courseid: number): Ampel => ({ courseid, colour: 'none', timecomputed: 0, signals: [] })

function progressOf(userid: number, c: MockCourse) {
  const steps = allSteps(c)
  return { completed: steps.filter((s) => isCompleted(userid, s.cmid)).length, total: steps.length }
}

function courseConfig(c: MockCourse) {
  return {
    courseid: c.id,
    usedefaults: c.usedefaults,
    thresholds: thresholdsOf(c),
    defaults: { ...DEFAULT_THRESHOLDS },
    paths: c.sections.map((s) => ({
      sectionid: s.id,
      name: s.name,
      meta: meta(`s${s.id}`),
      steps: s.steps.map((st) => ({ cmid: st.cmid, name: st.name, modname: st.modname, meta: meta(`c${st.cmid}`) })),
    })),
  }
}

// ---------------------------------------------------------------- portfolio

const PORTFOLIO_CATEGORIES = ['ergebnis', 'reflexion', 'strategie', 'ziel', 'feedback', 'tagebuch', 'nachweis']
const MOCK_MAX_FILE_SIZE = 10 * 1024 * 1024

function userName(id: number): string {
  return db.users.find((u) => u.id === id)?.fullname ?? ''
}

function toPortfolioEntry(e: MockPortfolioEntry): PortfolioEntry {
  const feedback = db.portfolioFeedback
    .filter((f) => f.entryid === e.id)
    .sort((a, b) => a.timecreated - b.timecreated || a.id - b.id)
  const latest = feedback.reduce((m, f) => Math.max(m, f.timecreated), 0)
  return {
    id: e.id,
    userid: e.userid,
    learnername: userName(e.userid),
    courseid: e.courseid,
    category: e.category as PortfolioEntry['category'],
    title: e.title,
    entrydate: e.entrydate,
    fields: Object.entries(e.fields).map(([key, value]) => ({ key, value })),
    selflevel: e.selflevel,
    tags: e.tags,
    links: e.links,
    status: e.status as PortfolioEntry['status'],
    revision: e.revision,
    timesubmitted: e.timesubmitted,
    timecreated: e.timecreated,
    timemodified: e.timemodified,
    unread: latest > e.timeread,
    files: e.files,
    feedback: feedback.map((f) => ({
      id: f.id,
      authorid: f.authorid,
      authorname: userName(f.authorid),
      message: f.message,
      status: f.status as PortfolioEntry['feedback'][number]['status'],
      revision: f.revision,
      timecreated: f.timecreated,
    })),
  }
}

function ownEntry(userid: number, id: number): MockPortfolioEntry {
  const e = db.portfolio.find((x) => x.id === id && x.userid === userid)
  if (!e || !canUse(userid, course(e.courseid))) {
    throw new MockException('portfolionotfound', 'Der Portfolio-Eintrag wurde nicht gefunden.')
  }
  return e
}

function requireEditable(e: MockPortfolioEntry) {
  if (e.status !== 'draft' && e.status !== 'revise') {
    throw new MockException(
      'portfolionoedit',
      'Dieser Eintrag kann nicht mehr geändert werden. Ändern ist nur bei Entwürfen und bei „Bitte überarbeiten“ möglich.',
    )
  }
}

function isHttp(url: string): boolean {
  return /^https?:\/\/\S+$/i.test(url)
}

// ---------------------------------------------------------------- handlers

type Handler = (userid: number, p: Params) => unknown

const handlers: Record<string, Handler> = {
  core_webservice_get_site_info: (userid) => {
    const u = db.users.find((x) => x.id === userid)!
    return { userid, username: u.username, fullname: u.fullname, sitename: 'GoPilot Mock-Moodle', lang: 'de' }
  },

  local_gopilot_get_overview: (userid) => {
    const u = db.users.find((x) => x.id === userid)!
    return {
      userid,
      fullname: u.fullname,
      currentweek: db.currentWeek,
      courses: db.courses
        .filter((c) => canUse(userid, c) || canCoach(userid, c) || c.configurers.includes(userid))
        .map((c) => ({
          id: c.id,
          shortname: c.shortname,
          fullname: c.fullname,
          canuse: canUse(userid, c),
          cancoach: canCoach(userid, c),
          canconfigure: c.configurers.includes(userid),
          progress: canUse(userid, c) ? progressOf(userid, c) : { completed: 0, total: 0 },
          ampel: canUse(userid, c) ? computeAmpel(userid, c) : noAmpel(c.id),
        })),
      week: buildWeek(userid, db.currentWeek),
      newfeedback: newFeedbackFor(userid),
    }
  },

  local_gopilot_get_paths: (userid, p) => {
    const c = course(num(p.courseid))
    if (!canUse(userid, c) && !canCoach(userid, c)) throw new MockException('nopermissions', 'Keine Berechtigung')
    return {
      course: { id: c.id, fullname: c.fullname },
      paths: c.sections.map((s) => {
        const steps = s.steps.map((st) => toStep(userid, c, st))
        return {
          sectionid: s.id,
          section: s.section,
          name: s.name,
          summary: s.summary,
          meta: meta(`s${s.id}`),
          completed: steps.filter((x) => x.completed).length,
          total: steps.filter((x) => x.tracked).length,
          steps,
        }
      }),
    }
  },

  local_gopilot_get_week: (userid, p) => {
    const week = str(p.week)
    requireWeek(week)
    return buildWeek(userid, week)
  },

  local_gopilot_save_plan: (userid, p) => {
    const week = str(p.week)
    requireWeek(week)
    if (isClosed(week)) throw new MockException('weekclosed', 'Diese Woche ist abgeschlossen und kann nicht mehr geplant werden.')
    const cmids = list(p.cmids).map(num)
    for (const cmid of cmids) {
      const found = findStep(cmid)
      if (!found || !canUse(userid, found.course)) throw new MockException('invalidcmid', `Lernschritt ${cmid} ist nicht verfügbar.`)
    }
    const w = ensureWeek(userid, week)
    w.goal = str(p.goal)
    w.cmids = [...new Set(cmids)]
    return buildWeek(userid, week)
  },

  local_gopilot_save_reflection: (userid, p) => {
    const week = str(p.week)
    requireWeek(week)
    if (week !== db.currentWeek && week !== addWeeks(db.currentWeek, -1)) {
      throw new MockException('reflectionclosed', 'Diese Woche kann nicht mehr reflektiert werden.')
    }
    const w = ensureWeek(userid, week)
    w.generalreflection = str(p.generalreflection)
    for (const raw of list(p.courses)) {
      const cp = raw as Params
      const c = course(num(cp.courseid))
      if (!canUse(userid, c)) throw new MockException('nopermissions', 'Keine Berechtigung')
      w.reflections[c.id] = str(cp.reflection)
      w.selfassessments[c.id] ??= {}
      for (const rs of list(cp.selfassessments)) {
        const s = rs as Params
        const level = num(s.level)
        if (level < 0 || level > 4) throw new MockException('invalidparameter', 'Ungültige Stufe')
        w.selfassessments[c.id][num(s.sectionid)] = { level, comment: str(s.comment) }
      }
    }
    w.reflectedat = db.now()
    return buildWeek(userid, week)
  },

  local_gopilot_get_biography: (userid, p) => {
    const page = num(p.page)
    const perpage = num(p.perpage) || 10
    const weeks = Object.entries(db.weeks[userid] ?? {})
      .filter(([, d]) => hasData(d))
      .map(([wk]) => wk)
      .sort()
      .reverse()
    return {
      total: weeks.length,
      weeks: weeks.slice(page * perpage, (page + 1) * perpage).map((wk) => buildWeek(userid, wk)),
    }
  },

  local_gopilot_get_lerndoku: (userid, p) => {
    const c = requireCoach(userid, num(p.courseid))
    return {
      course: { id: c.id, fullname: c.fullname },
      currentweek: db.currentWeek,
      learners: c.learners.map((lid) => {
        const u = db.users.find((x) => x.id === lid)!
        const cw = db.weeks[lid]?.[db.currentWeek]
        const plannedHere = planItems(lid, db.currentWeek, cw, c.id)
        const last = Object.entries(db.weeks[lid] ?? {})
          .filter(([, d]) => d.reflections[c.id])
          .sort(([a], [b]) => (a < b ? 1 : -1))[0]
        return {
          userid: lid,
          fullname: u.fullname,
          ampel: computeAmpel(lid, c),
          progress: progressOf(lid, c),
          lastreflection: last ? { week: last[0], text: last[1].reflections[c.id].slice(0, 200) } : { week: '', text: '' },
          unreadfeedback: 0,
          cohorts: u.cohorts ?? [],
          thisweek: {
            goal: (cw?.goal ?? '').slice(0, 200),
            planned: plannedHere.length,
            completed: plannedHere.filter((s) => s.completed).length,
            plannedall: planItems(lid, db.currentWeek, cw).length,
          },
        }
      }),
    }
  },

  local_gopilot_get_learner: (userid, p) => {
    const c = requireCoach(userid, num(p.courseid))
    const lid = num(p.userid)
    if (!c.learners.includes(lid)) throw new MockException('invaliduser', 'Person ist nicht in diesem Kurs')
    const u = db.users.find((x) => x.id === lid)!
    const weeks: LearnerWeek[] = Object.entries(db.weeks[lid] ?? {})
      .filter(([, d]) => hasData(d))
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([wk, d]) => ({
        week: wk,
        closed: isClosed(wk),
        goal: d.goal,
        generalreflection: d.generalreflection,
        reflectedat: d.reflectedat,
        items: planItems(lid, wk, d, c.id),
        reflection: d.reflections[c.id] ?? '',
        selfassessments: selfAssessmentsFor(c, d),
        feedback: feedbackFor(lid, c.id, wk),
      }))
    return { learner: { id: lid, fullname: u.fullname }, ampel: computeAmpel(lid, c), weeks }
  },

  local_gopilot_add_feedback: (userid, p) => {
    const c = course(num(p.courseid))
    const learner = num(p.userid)
    const week = str(p.week)
    requireWeek(week)
    const own = learner === userid && canUse(userid, c)
    if (!own && !canCoach(userid, c)) throw new MockException('nopermissions', 'Keine Berechtigung')
    const message = str(p.message).trim()
    if (!message) throw new MockException('emptymessage', 'Die Nachricht ist leer.')
    const entry = {
      id: db.nextId++, userid: learner, courseid: c.id, week, authorid: userid, message, timecreated: db.now(), timeread: 0,
    }
    db.feedback.push(entry)
    return feedbackFor(learner, c.id, week).find((f) => f.id === entry.id)
  },

  local_gopilot_mark_feedback_read: (userid, p) => {
    const ids = list(p.ids).map(num)
    let marked = 0
    for (const f of db.feedback) {
      if (ids.includes(f.id) && f.userid === userid && f.authorid !== userid && f.timeread === 0) {
        f.timeread = db.now()
        marked++
      }
    }
    return { marked }
  },

  local_gopilot_get_courseconfig: (userid, p) => {
    const c = course(num(p.courseid))
    if (!c.configurers.includes(userid)) throw new MockException('nopermissions', 'Keine Berechtigung')
    return courseConfig(c)
  },

  local_gopilot_save_courseconfig: (userid, p) => {
    const c = course(num(p.courseid))
    if (!c.configurers.includes(userid)) throw new MockException('nopermissions', 'Keine Berechtigung')
    const usedefaults = bool(p.usedefaults)
    if (!usedefaults) {
      const t = p.thresholds as Params
      const th: Thresholds = {
        plangreen: num(t.plangreen),
        planyellow: num(t.planyellow),
        backlogyellow: num(t.backlogyellow),
        backlogred: num(t.backlogred),
        reflectionyellow: num(t.reflectionyellow),
        reflectionred: num(t.reflectionred),
      }
      if (!(th.planyellow < th.plangreen && th.backlogyellow < th.backlogred && th.reflectionyellow < th.reflectionred)) {
        throw new MockException('invalidthresholds', 'Die Schwellwerte sind ungültig: Gelb muss unter der nächsten Stufe liegen.')
      }
      c.thresholds = th
    }
    c.usedefaults = usedefaults
    return courseConfig(c)
  },

  local_gopilot_save_pathmeta: (userid, p) => {
    const c = course(num(p.courseid))
    if (!c.configurers.includes(userid)) throw new MockException('nopermissions', 'Keine Berechtigung')
    for (const raw of list(p.items)) {
      const it = raw as Params
      const prefix = str(it.type) === 'section' ? 's' : 'c'
      db.meta[`${prefix}${num(it.id)}`] = { phase: str(it.phase), duration: num(it.duration), level: num(it.level) }
    }
    return { success: true }
  },

  // No real Moodle session in mock mode: the link is the target itself.
  local_gopilot_get_moodle_link: (_userid, p) => ({ url: str(p.url), validuntil: Math.floor(Date.now() / 1000) + 60 }),

  local_gopilot_get_push_config: () => ({
    enabled: true,
    publickey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
  }),

  local_gopilot_register_push: () => ({ success: true }),
  local_gopilot_unregister_push: () => ({ success: true }),

  local_gopilot_get_portfolio: (userid, p) => {
    const c = course(num(p.courseid))
    if (!canUse(userid, c)) throw new MockException('notalearner', 'Du bist in diesem Kurs nicht als Lernende:r eingetragen.')
    const entries = db.portfolio
      .filter((e) => e.courseid === c.id && e.userid === userid)
      .sort((a, b) => b.timemodified - a.timemodified || b.id - a.id)
      .map(toPortfolioEntry)
    return { course: { id: c.id, fullname: c.fullname }, maxfilesize: MOCK_MAX_FILE_SIZE, entries }
  },

  local_gopilot_save_portfolio_entry: (userid, p) => {
    const category = str(p.category)
    if (!PORTFOLIO_CATEGORIES.includes(category)) {
      throw new MockException('invalidportfoliocategory', 'Unbekannte Kategorie für den Portfolio-Eintrag.')
    }
    const title = str(p.title).trim()
    if (!title) throw new MockException('portfoliotitlemissing', 'Bitte gib einen Titel ein.')
    const entrydate = str(p.entrydate).trim()
    if (entrydate && !/^\d{4}-\d{2}-\d{2}$/.test(entrydate)) {
      throw new MockException('invalidportfoliodate', 'Das Datum muss die Form JJJJ-MM-TT haben.')
    }
    const fields: Record<string, string> = {}
    for (const f of list(p.fields) as Record<string, ParamValue>[]) {
      const v = str(f.value).trim()
      if (v) fields[str(f.key)] = v
    }
    const links = (list(p.links) as Record<string, ParamValue>[]).map((l) => {
      const url = str(l.url).trim()
      if (!isHttp(url)) throw new MockException('invalidportfoliolink', 'Links müssen mit http:// oder https:// beginnen.')
      return { label: str(l.label).trim() || url, url }
    })
    const values = { category, title, entrydate, fields, selflevel: num(p.selflevel), tags: str(p.tags).trim(), links, timemodified: db.now() }
    const id = num(p.id)
    if (!id) {
      const c = course(num(p.courseid))
      if (!canUse(userid, c)) throw new MockException('notalearner', 'Du bist in diesem Kurs nicht als Lernende:r eingetragen.')
      const e: MockPortfolioEntry = {
        ...values, id: db.nextId++, userid, courseid: c.id, status: 'draft', revision: 0, timesubmitted: 0, timeread: 0,
        timecreated: db.now(), files: [],
      }
      db.portfolio.push(e)
      return toPortfolioEntry(e)
    }
    const e = ownEntry(userid, id)
    requireEditable(e)
    Object.assign(e, values)
    return toPortfolioEntry(e)
  },

  local_gopilot_change_portfolio_status: (userid, p) => {
    const e = ownEntry(userid, num(p.id))
    const action = str(p.action)
    if (action === 'submit' && (e.status === 'draft' || e.status === 'revise')) {
      Object.assign(e, { status: 'submitted', revision: e.revision + 1, timesubmitted: db.now(), timemodified: db.now() })
      return toPortfolioEntry(e)
    }
    if (action === 'withdraw' && e.status === 'submitted' && !db.portfolioFeedback.some((f) => f.entryid === e.id)) {
      Object.assign(e, { status: 'draft', revision: Math.max(0, e.revision - 1), timemodified: db.now() })
      return toPortfolioEntry(e)
    }
    throw new MockException('portfolioinvalidstatus', 'Das geht im aktuellen Status des Eintrags nicht.')
  },

  local_gopilot_delete_portfolio_entry: (userid, p) => {
    const e = ownEntry(userid, num(p.id))
    if (e.status !== 'draft') throw new MockException('portfolionoedit', 'Nur Entwürfe können gelöscht werden.')
    db.portfolio = db.portfolio.filter((x) => x.id !== e.id)
    return { success: true }
  },

  local_gopilot_upload_portfolio_file: (userid, p) => {
    const e = ownEntry(userid, num(p.entryid))
    requireEditable(e)
    const size = Math.floor((str(p.content).length * 3) / 4)
    if (size > MOCK_MAX_FILE_SIZE) throw new MockException('portfoliofiletoobig', 'Die Datei ist zu groß.')
    if (e.files.length >= 10) throw new MockException('portfoliotoomanyfiles', 'Ein Eintrag kann höchstens 10 Anhänge haben.')
    let filename = str(p.filename) || 'datei'
    while (e.files.some((f) => f.filename === filename)) filename = filename.replace(/(\.[^.]*)?$/, ' (1)$1')
    const file = {
      id: db.nextId++,
      filename,
      mimetype: 'application/octet-stream',
      filesize: size,
      url: `${moodleUrl}/pluginfile.php/1/local_gopilot/portfolio/${e.id}/${encodeURIComponent(filename)}`,
    }
    e.files.push(file)
    e.timemodified = db.now()
    return file
  },

  local_gopilot_delete_portfolio_file: (userid, p) => {
    const e = ownEntry(userid, num(p.entryid))
    requireEditable(e)
    const before = e.files.length
    e.files = e.files.filter((f) => f.id !== num(p.fileid))
    if (e.files.length === before) throw new MockException('portfoliofilenotfound', 'Der Anhang wurde nicht gefunden.')
    return { success: true }
  },

  local_gopilot_mark_portfolio_read: (userid, p) => {
    let marked = 0
    for (const id of list(p.ids).map(num)) {
      const e = db.portfolio.find((x) => x.id === id && x.userid === userid)
      if (e && toPortfolioEntry(e).unread) {
        e.timeread = db.now()
        marked++
      }
    }
    return { marked }
  },

  local_gopilot_get_course_portfolios: (userid, p) => {
    const c = requireCoach(userid, num(p.courseid))
    const only = num(p.userid)
    if (only && !c.learners.includes(only)) throw new MockException('notalearner', 'Keine Lernende:r in diesem Kurs.')
    const submitted = db.portfolio.filter((e) => e.courseid === c.id && e.status !== 'draft' && c.learners.includes(e.userid))
    const learners = c.learners.map((id) => {
      const mine = submitted.filter((e) => e.userid === id)
      return {
        id,
        fullname: userName(id),
        total: mine.length,
        open: mine.filter((e) => e.status === 'submitted').length,
        revise: mine.filter((e) => e.status === 'revise').length,
        done: mine.filter((e) => e.status === 'done').length,
        lastsubmitted: mine.reduce((m, e) => Math.max(m, e.timesubmitted), 0),
      }
    })
    const entries = submitted
      .filter((e) => !only || e.userid === only)
      .sort((a, b) => Number(b.status === 'submitted') - Number(a.status === 'submitted') || b.timesubmitted - a.timesubmitted)
      .map(toPortfolioEntry)
    return { course: { id: c.id, fullname: c.fullname }, learners, entries }
  },

  local_gopilot_add_portfolio_feedback: (userid, p) => {
    const e = db.portfolio.find((x) => x.id === num(p.id))
    if (!e) throw new MockException('portfolionotfound', 'Der Portfolio-Eintrag wurde nicht gefunden.')
    requireCoach(userid, e.courseid)
    const status = str(p.status)
    if (!['feedback', 'revise', 'done'].includes(status)) throw new MockException('invalidparameter', 'Ungültiger Status')
    if (e.status === 'draft') throw new MockException('portfolioinvalidstatus', 'Das geht im aktuellen Status des Eintrags nicht.')
    const message = str(p.message).trim()
    if (!message && status !== 'done') throw new MockException('emptymessage', 'Die Nachricht ist leer.')
    db.portfolioFeedback.push({
      id: db.nextId++, entryid: e.id, authorid: userid, message, status, revision: e.revision, timecreated: db.now(),
    })
    Object.assign(e, { status, timemodified: db.now() })
    return toPortfolioEntry(e)
  },

  core_completion_update_activity_completion_status_manually: (userid, p) => {
    const cmid = num(p.cmid)
    const found = findStep(cmid)
    if (!found || !canUse(userid, found.course)) throw new MockException('invalidcmid', 'Lernschritt nicht gefunden')
    if (!found.step.manual) throw new MockException('cannotmanualctrack', 'Dieser Lernschritt wird automatisch abgeschlossen.')
    db.completions[userid] ??= {}
    if (bool(p.completed)) db.completions[userid][cmid] = db.now()
    else delete db.completions[userid][cmid]
    return { status: true, warnings: [] }
  },
}

