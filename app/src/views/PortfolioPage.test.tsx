import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getMockDb, mockRequests } from '../api/mock/server'
import { renderApp } from '../test/renderApp'

describe('Portfolio', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 12, 10, 0)) // Donnerstag, KW 46
  })
  afterEach(() => vi.useRealTimers())

  it('zeigt die eigenen Einträge mit Status und neuer Rückmeldung', async () => {
    renderApp('/portfolio/101', 11)
    expect(await screen.findByText('ER-Modell Fahrradverleih')).toBeInTheDocument()
    expect(screen.getByText('Rückblick auf LS 5.1')).toBeInTheDocument()
    expect(screen.getAllByText('Bitte überarbeiten').length).toBeGreaterThan(0)
    expect(screen.getByText('Entwurf · noch nicht eingereicht')).toBeInTheDocument()
    expect(screen.getByText('Neue Rückmeldung')).toBeInTheDocument()
    // Ben's entry is not part of Ada's portfolio.
    expect(screen.queryByText('Karteikarten für SQL-Befehle')).toBeNull()
  })

  it('filtert nach Register', async () => {
    const user = userEvent.setup()
    renderApp('/portfolio/101', 11)
    await screen.findByText('ER-Modell Fahrradverleih')
    await user.click(screen.getByRole('radio', { name: /Reflexionsbögen/ }))
    expect(screen.queryByText('ER-Modell Fahrradverleih')).toBeNull()
    expect(screen.getByText('Rückblick auf LS 5.1')).toBeInTheDocument()
  })

  it('öffnet einen Eintrag per Deep-Link und markiert die Rückmeldung als gelesen', async () => {
    renderApp('/portfolio/101/901', 11)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Bitte ergänze noch die Attribute/)).toBeInTheDocument()
    expect(within(dialog).getByText('er-modell.png')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Überarbeiten' })).toBeInTheDocument()
    await waitFor(() =>
      expect(mockRequests.find((r) => r.wsfunction === 'local_gopilot_mark_portfolio_read')?.params).toEqual({ ids: [901] }),
    )
  })

  it('legt eine Reflexion an und reicht sie ein', async () => {
    const user = userEvent.setup()
    renderApp('/portfolio/101', 11)
    await screen.findByText('ER-Modell Fahrradverleih')
    await user.click(screen.getAllByRole('button', { name: 'Neuer Eintrag' })[0])
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Reflexion' }))
    await user.type(within(dialog).getByLabelText(/Titel/), 'Woche 46')
    await user.type(within(dialog).getByLabelText('Was habe ich gelernt?'), 'JOINs verstehen')
    await user.click(within(dialog).getByRole('button', { name: 'Speichern und einreichen' }))

    await waitFor(() =>
      expect(mockRequests.some((r) => r.wsfunction === 'local_gopilot_change_portfolio_status')).toBe(true),
    )
    const save = mockRequests.find((r) => r.wsfunction === 'local_gopilot_save_portfolio_entry')!
    expect(save.params).toMatchObject({ id: 0, courseid: 101, category: 'reflexion', title: 'Woche 46' })
    expect(save.params.fields).toContainEqual({ key: 'gelernt', value: 'JOINs verstehen' })
    const created = getMockDb().portfolio.find((e) => e.title === 'Woche 46')!
    expect(created.status).toBe('submitted')
    expect(created.revision).toBe(1)
  })

  it('Lerncoach sieht eingereichte Einträge, aber keine Entwürfe, und gibt eine Rückmeldung', async () => {
    const user = userEvent.setup()
    renderApp('/lerndoku/101/portfolio', 2)
    expect(await screen.findByText('Karteikarten für SQL-Befehle')).toBeInTheDocument()
    expect(screen.queryByText('Rückblick auf LS 5.1')).toBeNull()

    const card = screen.getByRole('heading', { name: 'Karteikarten für SQL-Befehle' }).closest('.mantine-Card-root') as HTMLElement
    await user.type(within(card).getByLabelText('Rückmeldung'), 'Super Idee, probier auch Anki aus.')
    await user.click(within(card).getByRole('button', { name: 'Senden' }))

    await waitFor(() => expect(getMockDb().portfolio.find((e) => e.id === 903)?.status).toBe('feedback'))
    expect(mockRequests.find((r) => r.wsfunction === 'local_gopilot_add_portfolio_feedback')?.params).toEqual({
      id: 903,
      message: 'Super Idee, probier auch Anki aus.',
      status: 'feedback',
    })
  })
})

describe('Portfolio-Links aus dem Teaching Assistant', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 12, 10, 0))
  })
  afterEach(() => vi.useRealTimers())

  it('/portfolio/neu/strategie?name=… fragt nach dem Kurs und füllt die Strategie mit Beschreibung vor', async () => {
    const user = userEvent.setup()
    renderApp('/portfolio/neu/strategie?name=Abruf%C3%BCbung', 11)
    expect(await screen.findByText(/In welchem Kurs möchtest du den Eintrag „Lernstrategie“ anlegen/)).toBeInTheDocument()
    await user.click(screen.getByText('LF5 Software zur Verwaltung von Daten anpassen'))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText(/Titel/)).toHaveValue('Lernstrategie: Abrufübung')
    expect(within(dialog).getByLabelText('Welche Lernstrategie habe ich genutzt?')).toHaveValue('Abrufübung')
    expect(within(dialog).getByText(/Klapp deine Unterlagen zu/)).toBeInTheDocument()
  })

  it('/portfolio/neu/tagebuch öffnet einen Eintrag mit den Check-out-Fragen', async () => {
    renderApp('/portfolio/neu/tagebuch', 11)
    await userEvent.click(await screen.findByText('LF5 Software zur Verwaltung von Daten anpassen'))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText(/Titel/)).toHaveValue('Check-out 12.11.2026')
    expect(within(dialog).getByLabelText('Das nehme ich mit')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Das ist mir noch unklar')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Damit will ich mich intensiver auseinandersetzen')).toBeInTheDocument()
  })

  it('übernimmt eine eigene Strategie mit Beschreibung aus dem Link', async () => {
    renderApp('/portfolio/101?neu=strategie&name=Lernplakat&text=Ein%20Plakat%20gestalten', 11)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Welche Lernstrategie habe ich genutzt?')).toHaveValue('Lernplakat')
    expect(within(dialog).getByText('Ein Plakat gestalten')).toBeInTheDocument()
  })

  it('zeigt Lehrkräften den Link zum Unterrichtsassistenten', async () => {
    renderApp('/lerndoku/101', 2)
    const link = await screen.findByRole('link', { name: /Unterrichtsassistent/ })
    expect(link).toHaveAttribute('href', 'https://herr-fr.github.io/Gopilot_teaching-assistent/')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
