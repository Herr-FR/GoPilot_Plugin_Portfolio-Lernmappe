import { call } from './client'
import type {
  Biography,
  CompletionUpdateResponse,
  CourseConfig,
  CoursePortfolios,
  FeedbackEntry,
  LearnerDetail,
  Lerndoku,
  MoodleLink,
  Overview,
  PathMetaItem,
  PathsResponse,
  Portfolio,
  PortfolioEntry,
  PortfolioFeedbackStatus,
  PortfolioFile,
  PushConfig,
  SaveCourseConfigParams,
  SavePortfolioEntryParams,
  SaveReflectionParams,
  SuccessResponse,
  Week,
  WeekString,
} from './types'

/**
 * Typed wrappers, one per web service function of the contract.
 * Exported as an object so tests can spy on single functions.
 */
export const api = {
  getOverview: () => call<Overview>('local_gopilot_get_overview'),

  getPaths: (courseid: number) => call<PathsResponse>('local_gopilot_get_paths', { courseid }),

  getWeek: (week: WeekString) => call<Week>('local_gopilot_get_week', { week }),

  savePlan: (week: WeekString, goal: string, cmids: number[]) =>
    call<Week>('local_gopilot_save_plan', { week, goal, cmids }),

  saveReflection: (p: SaveReflectionParams) =>
    call<Week>('local_gopilot_save_reflection', {
      week: p.week,
      generalreflection: p.generalreflection,
      courses: p.courses.map((c) => ({
        courseid: c.courseid,
        reflection: c.reflection,
        selfassessments: c.selfassessments.map((s) => ({
          sectionid: s.sectionid,
          level: s.level,
          comment: s.comment,
        })),
      })),
    }),

  getBiography: (page: number, perpage = 10) =>
    call<Biography>('local_gopilot_get_biography', { page, perpage }),

  getLerndoku: (courseid: number) => call<Lerndoku>('local_gopilot_get_lerndoku', { courseid }),

  getLearner: (courseid: number, userid: number) =>
    call<LearnerDetail>('local_gopilot_get_learner', { courseid, userid }),

  addFeedback: (courseid: number, userid: number, week: WeekString, message: string) =>
    call<FeedbackEntry>('local_gopilot_add_feedback', { courseid, userid, week, message }),

  markFeedbackRead: (ids: number[]) => call<{ marked: number }>('local_gopilot_mark_feedback_read', { ids }),

  getCourseConfig: (courseid: number) =>
    call<CourseConfig>('local_gopilot_get_courseconfig', { courseid }),

  saveCourseConfig: (p: SaveCourseConfigParams) =>
    call<CourseConfig>('local_gopilot_save_courseconfig', {
      courseid: p.courseid,
      usedefaults: p.usedefaults,
      thresholds: { ...p.thresholds },
    }),

  savePathMeta: (courseid: number, items: PathMetaItem[]) =>
    call<SuccessResponse>('local_gopilot_save_pathmeta', {
      courseid,
      items: items.map((i) => ({ ...i })),
    }),

  /** One-time link that logs the user into Moodle and opens `url` there. */
  getMoodleLink: (url: string) => call<MoodleLink>('local_gopilot_get_moodle_link', { url }),

  getPushConfig: () => call<PushConfig>('local_gopilot_get_push_config'),

  registerPush: (endpoint: string, p256dh: string, auth: string) =>
    call<SuccessResponse>('local_gopilot_register_push', { endpoint, p256dh, auth }),

  unregisterPush: (endpoint: string) =>
    call<SuccessResponse>('local_gopilot_unregister_push', { endpoint }),

  getPortfolio: (courseid: number) => call<Portfolio>('local_gopilot_get_portfolio', { courseid }),

  savePortfolioEntry: (p: SavePortfolioEntryParams) =>
    call<PortfolioEntry>('local_gopilot_save_portfolio_entry', {
      id: p.id,
      courseid: p.courseid,
      category: p.category,
      title: p.title,
      entrydate: p.entrydate,
      fields: p.fields.map((f) => ({ key: f.key, value: f.value })),
      selflevel: p.selflevel,
      tags: p.tags,
      links: p.links.map((l) => ({ label: l.label, url: l.url })),
    }),

  changePortfolioStatus: (id: number, action: 'submit' | 'withdraw') =>
    call<PortfolioEntry>('local_gopilot_change_portfolio_status', { id, action }),

  deletePortfolioEntry: (id: number) => call<SuccessResponse>('local_gopilot_delete_portfolio_entry', { id }),

  /** `content` is the file content as Base64 (without data: prefix). */
  uploadPortfolioFile: (entryid: number, filename: string, content: string) =>
    call<PortfolioFile>('local_gopilot_upload_portfolio_file', { entryid, filename, content }),

  deletePortfolioFile: (entryid: number, fileid: number) =>
    call<SuccessResponse>('local_gopilot_delete_portfolio_file', { entryid, fileid }),

  markPortfolioRead: (ids: number[]) => call<{ marked: number }>('local_gopilot_mark_portfolio_read', { ids }),

  getCoursePortfolios: (courseid: number, userid = 0) =>
    call<CoursePortfolios>('local_gopilot_get_course_portfolios', { courseid, userid }),

  addPortfolioFeedback: (id: number, message: string, status: PortfolioFeedbackStatus) =>
    call<PortfolioEntry>('local_gopilot_add_portfolio_feedback', { id, message, status }),

  /** Ticks or unticks a step with manual completion. */
  setStepCompletion: (cmid: number, completed: boolean) =>
    call<CompletionUpdateResponse>('core_completion_update_activity_completion_status_manually', {
      cmid,
      completed,
    }),
}
