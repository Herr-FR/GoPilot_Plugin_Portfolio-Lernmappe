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
