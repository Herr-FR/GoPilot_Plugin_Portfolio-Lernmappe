import {
  ActionIcon,
  Anchor,
  Autocomplete,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Chip,
  FileButton,
  Group,
  Modal,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconArrowBackUp,
  IconEdit,
  IconFile,
  IconInfoCircle,
  IconLink,
  IconPaperclip,
  IconPlus,
  IconSearch,
  IconSend,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { errorMessage } from '../api/client'
import {
  useChangePortfolioStatus,
  useDeletePortfolioEntry,
  useDeletePortfolioFile,
  useMarkPortfolioRead,
  useOverview,
  usePortfolio,
  useSavePortfolioEntry,
  useUploadPortfolioFile,
} from '../api/hooks'
import type { PortfolioCategory, PortfolioEntry, PortfolioLink } from '../api/types'
import { Notice } from '../components/Notice'
import { PageHeader } from '../components/PageHeader'
import { PortfolioEntryView, PortfolioStatusBadge } from '../components/PortfolioEntryView'
import { ErrorAlert, Loading } from '../components/QueryState'
import { SELF_ASSESSMENT_LEVELS } from '../lib/ampel'
import {
  categoryInfo,
  excerpt,
  formatEntryDate,
  fileToBase64,
  formatFileSize,
  isEditable,
  isHttpUrl,
  LEARNING_STRATEGIES,
  parsePrefill,
  PORTFOLIO_CATEGORIES,
  strategyByName,
  type PortfolioPrefill,
} from '../lib/portfolio'

const ALL = 'alle'

function todayString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Course choice for learners with more than one course. */
export function PortfolioIndexPage() {
  const overview = useOverview()
  // Keeps ?neu=… of a pre-filled entry (QR code from the Teaching Assistant) through the course choice.
  const { search } = useLocation()
  const prefill = parsePrefill(new URLSearchParams(search))
  if (overview.isPending) return <Loading />
  if (overview.isError) return <ErrorAlert error={overview.error} onRetry={() => overview.refetch()} />
  const courses = overview.data.courses.filter((c) => c.canuse)
  if (courses.length === 1) return <Navigate to={`/portfolio/${courses[0].id}${search}`} replace />
  return (
    <>
      <PageHeader
        title="Portfolio"
        description={
          prefill
            ? `In welchem Kurs möchtest du den Eintrag „${categoryInfo(prefill.category).one}“ anlegen?`
            : 'Deine Mappe pro Kurs: Arbeitsergebnisse, Reflexionen, Lernstrategien und Nachweise sammeln und mit deinem Lerncoach teilen.'
        }
      />
      {courses.length === 0 ? (
        <Text c="dimmed">Du bist in keinem Kurs als Lernende:r eingetragen.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {courses.map((c) => (
            <Card key={c.id} withBorder radius="md" component={Link} to={`/portfolio/${c.id}${search}`} padding="md">
              <Text fw={600}>{c.fullname}</Text>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </>
  )
}

/** Card of an entry in the list. */
function EntryCard({ entry, onOpen }: { entry: PortfolioEntry; onOpen: () => void }) {
  const cat = categoryInfo(entry.category)
  const attachments = entry.files.length + entry.links.length
  const last = entry.feedback[entry.feedback.length - 1]
  return (
    <Card withBorder radius="md" padding="sm">
      <UnstyledButton onClick={onOpen} aria-label={`${entry.title} öffnen`} style={{ display: 'block', width: '100%' }}>
        <Stack gap={6}>
          <Group justify="space-between" gap="xs" wrap="wrap">
            <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
              <ThemeIcon color={cat.color} variant="light" size={24} radius="md" aria-hidden>
                <cat.icon size={14} />
              </ThemeIcon>
              <Text size="xs" c="dimmed" truncate>
                {cat.one}
                {entry.entrydate ? ` · ${formatEntryDate(entry.entrydate)}` : ''}
              </Text>
            </Group>
            <Group gap={4} wrap="wrap">
              {entry.unread && (
                <Badge size="sm" color="yellow" c="dark" styles={{ label: { textTransform: 'none' } }}>
                  Neue Rückmeldung
                </Badge>
              )}
              <PortfolioStatusBadge status={entry.status} />
            </Group>
          </Group>
          <Text fw={700}>{entry.title}</Text>
          {excerpt(entry) && (
            <Text size="sm" c="dimmed" lineClamp={2}>
              {excerpt(entry)}
            </Text>
          )}
          {last?.message && (
            <Text size="sm" lineClamp={2}>
              <Text span fw={600} size="sm">
                Rückmeldung:{' '}
              </Text>
              {last.message}
            </Text>
          )}
          {attachments > 0 && (
            <Group gap={4}>
              <IconPaperclip size={14} aria-hidden />
              <Text size="xs" c="dimmed">
                {attachments} {attachments === 1 ? 'Anhang' : 'Anhänge'}
              </Text>
            </Group>
          )}
        </Stack>
      </UnstyledButton>
    </Card>
  )
}

interface EditorState {
  id: number
  category: PortfolioCategory | null
  title: string
  entrydate: string
  answers: Record<string, string>
  selflevel: number
  tags: string
  links: PortfolioLink[]
  status: PortfolioEntry['status']
}

function editorState(
  entry: PortfolioEntry | null,
  category: PortfolioCategory | null,
  prefill?: PortfolioPrefill | null,
): EditorState {
  if (!entry) {
    return {
      id: 0,
      category: prefill?.category ?? category,
      title: prefill?.title ?? '',
      entrydate: todayString(),
      answers: { ...prefill?.answers },
      selflevel: 0,
      tags: '',
      links: [],
      status: 'draft',
    }
  }
  return {
    id: entry.id,
    category: entry.category,
    title: entry.title,
    entrydate: entry.entrydate,
    answers: Object.fromEntries(entry.fields.map((f) => [f.key, f.value])),
    selflevel: entry.selflevel,
    tags: entry.tags,
    links: entry.links,
    status: entry.status,
  }
}

/** Create or change an entry, with attachments. */
function EntryEditor({
  courseid,
  entry,
  initialCategory,
  prefill,
  maxfilesize,
  onClose,
}: {
  courseid: number
  entry: PortfolioEntry | null
  initialCategory: PortfolioCategory | null
  prefill?: PortfolioPrefill | null
  maxfilesize: number
  onClose: (savedId?: number) => void
}) {
  const [state, setState] = useState<EditorState>(() => editorState(entry, initialCategory, prefill))
  const [pending, setPending] = useState<File[]>([])
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const resetFiles = useRef<() => void>(null)
  const save = useSavePortfolioEntry()
  const upload = useUploadPortfolioFile()
  const removeFile = useDeletePortfolioFile()
  const status = useChangePortfolioStatus()
  const cat = state.category ? categoryInfo(state.category) : null
  const set = (patch: Partial<EditorState>) => setState((s) => ({ ...s, ...patch }))

  const addLink = () => {
    const url = linkUrl.trim()
    if (!isHttpUrl(url)) {
      notifications.show({ color: 'red', message: 'Bitte einen Link mit https:// eingeben.' })
      return
    }
    set({ links: [...state.links, { label: linkLabel.trim() || url, url }] })
    setLinkLabel('')
    setLinkUrl('')
  }

  const addFiles = (files: File[]) => {
    const ok: File[] = []
    for (const f of files) {
      if (maxfilesize > 0 && f.size > maxfilesize) {
        notifications.show({
          color: 'red',
          title: 'Datei zu groß',
          message: `${f.name} ist größer als ${formatFileSize(maxfilesize)}.`,
        })
      } else {
        ok.push(f)
      }
    }
    setPending((p) => [...p, ...ok])
    resetFiles.current?.()
  }

  const submit = async (andSubmit: boolean) => {
    if (!cat || !state.category) return
    if (!state.title.trim()) {
      notifications.show({ color: 'red', message: 'Bitte gib einen Titel ein.' })
      return
    }
    setBusy(true)
    try {
      const saved = await save.mutateAsync({
        id: state.id,
        courseid,
        category: state.category,
        title: state.title.trim(),
        entrydate: state.entrydate,
        fields: cat.questions.map((q) => ({ key: q.key, value: (state.answers[q.key] ?? '').trim() })),
        selflevel: cat.selfassessment ? state.selflevel : 0,
        tags: state.tags.trim(),
        links: state.links,
      })
      for (const file of pending) {
        try {
          await upload.mutateAsync({
            entryid: saved.id,
            courseid,
            filename: file.name,
            content: await fileToBase64(file),
          })
        } catch (e) {
          notifications.show({ color: 'red', title: `${file.name} nicht hochgeladen`, message: errorMessage(e) })
        }
      }
      if (andSubmit) {
        await status.mutateAsync({ id: saved.id, action: 'submit' })
        notifications.show({
          color: 'teal',
          title: 'Eingereicht',
          message: 'Dein Lerncoach kann den Eintrag jetzt sehen und dir eine Rückmeldung geben.',
        })
      } else {
        notifications.show({ color: 'teal', message: 'Gespeichert.' })
      }
      onClose(saved.id)
    } catch (e) {
      notifications.show({ color: 'red', title: 'Nicht gespeichert', message: errorMessage(e) })
    } finally {
      setBusy(false)
    }
  }

  const deleteExisting = (fileid: number, filename: string) =>
    removeFile.mutate(
      { entryid: state.id, courseid, fileid },
      {
        onSuccess: () => notifications.show({ color: 'teal', message: `${filename} entfernt.` }),
        onError: (e) => notifications.show({ color: 'red', title: 'Nicht entfernt', message: errorMessage(e) }),
      },
    )

  const isRevise = state.status === 'revise'

  return (
    <Stack gap="sm">
      {!state.id && (
        <div>
          <Text size="sm" fw={500} mb={6}>
            Was möchtest du ablegen?
          </Text>
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
            {PORTFOLIO_CATEGORIES.map((c) => (
              <Button
                key={c.key}
                variant={state.category === c.key ? 'filled' : 'default'}
                color={c.color}
                leftSection={<c.icon size={16} />}
                onClick={() => set({ category: c.key })}
                justify="flex-start"
                aria-pressed={state.category === c.key}
                styles={{ label: { whiteSpace: 'normal', textAlign: 'left' } }}
                h="auto"
                py={6}
              >
                {c.one}
              </Button>
            ))}
          </SimpleGrid>
        </div>
      )}

      {cat && (
        <>
          {isRevise && (
            <Notice color="orange" icon={<IconInfoCircle />}>
              Dein Lerncoach bittet dich, den Eintrag zu überarbeiten. Reiche ihn danach erneut ein.
            </Notice>
          )}
          <TextInput
            label="Titel"
            required
            maxLength={255}
            value={state.title}
            onChange={(e) => set({ title: e.currentTarget.value })}
            placeholder="Kurzer, aussagekräftiger Titel"
          />
          <TextInput
            label="Datum"
            type="date"
            value={state.entrydate}
            onChange={(e) => set({ entrydate: e.currentTarget.value })}
            maw={220}
          />
          {cat.questions.map((q) => {
            const value = state.answers[q.key] ?? ''
            const onChange = (v: string) => set({ answers: { ...state.answers, [q.key]: v } })
            if (q.key === 'strategie' && cat.key === 'strategie') {
              const known = strategyByName(value)
              const description = known?.text ?? (value && value === prefill?.answers.strategie ? prefill.strategyText : '')
              return (
                <Stack key={q.key} gap={6}>
                  <Autocomplete
                    label={q.label}
                    placeholder={q.placeholder}
                    data={LEARNING_STRATEGIES.map((s) => s.name)}
                    value={value}
                    onChange={onChange}
                  />
                  {description && (
                    <Notice color="grape" icon={<IconInfoCircle />}>
                      <Text size="sm">{description}</Text>
                      {known?.link && (
                        <Anchor href={known.link} target="_blank" rel="noopener noreferrer" size="sm">
                          Mehr erfahren
                        </Anchor>
                      )}
                    </Notice>
                  )}
                </Stack>
              )
            }
            return q.short ? (
              <TextInput
                key={q.key}
                label={q.label}
                placeholder={q.placeholder}
                value={value}
                onChange={(e) => onChange(e.currentTarget.value)}
              />
            ) : (
              <Textarea
                key={q.key}
                label={q.label}
                placeholder={q.placeholder}
                autosize
                minRows={2}
                value={value}
                onChange={(e) => onChange(e.currentTarget.value)}
              />
            )
          })}

          {cat.selfassessment && (
            <div>
              <Text size="sm" fw={500} mb={4} id="portfolio-selflevel">
                Selbsteinschätzung
              </Text>
              <SegmentedControl
                aria-labelledby="portfolio-selflevel"
                fullWidth
                data={[
                  { value: '0', label: 'keine Angabe' },
                  ...SELF_ASSESSMENT_LEVELS.map((l) => ({ value: String(l.value), label: l.label })),
                ]}
                value={String(state.selflevel)}
                onChange={(v) => set({ selflevel: Number(v) })}
                styles={{ label: { whiteSpace: 'normal', lineHeight: 1.2 } }}
              />
            </div>
          )}

          <TextInput
            label="Schlagworte"
            description="Optional, mit Komma getrennt"
            value={state.tags}
            onChange={(e) => set({ tags: e.currentTarget.value })}
            maxLength={255}
          />

          <div>
            <Text size="sm" fw={500} mb={4}>
              Anhänge und Links
            </Text>
            <Stack gap={4}>
              {entry?.files.map((f) => (
                <Group key={f.id} gap="xs" wrap="nowrap">
                  <IconFile size={16} aria-hidden />
                  <Text size="sm" truncate style={{ flex: 1 }}>
                    {f.filename}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label={`${f.filename} entfernen`}
                    onClick={() => deleteExisting(f.id, f.filename)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
              {pending.map((f, i) => (
                <Group key={`${f.name}-${i}`} gap="xs" wrap="nowrap">
                  <IconFile size={16} aria-hidden />
                  <Text size="sm" truncate style={{ flex: 1 }}>
                    {f.name}{' '}
                    <Text span size="xs" c="dimmed">
                      (wird beim Speichern hochgeladen)
                    </Text>
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label={`${f.name} nicht hochladen`}
                    onClick={() => setPending((p) => p.filter((_, j) => j !== i))}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              ))}
              {state.links.map((l, i) => (
                <Group key={`${l.url}-${i}`} gap="xs" wrap="nowrap">
                  <IconLink size={16} aria-hidden />
                  <Text size="sm" truncate style={{ flex: 1 }}>
                    {l.label}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label={`Link ${l.label} entfernen`}
                    onClick={() => set({ links: state.links.filter((_, j) => j !== i) })}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
            <Group gap="xs" mt="xs">
              <FileButton onChange={addFiles} multiple resetRef={resetFiles}>
                {(props) => (
                  <Button {...props} variant="light" size="xs" leftSection={<IconPaperclip size={14} />}>
                    Datei anhängen
                  </Button>
                )}
              </FileButton>
              {maxfilesize > 0 && (
                <Text size="xs" c="dimmed">
                  bis {formatFileSize(maxfilesize)} je Datei, gespeichert in Moodle
                </Text>
              )}
            </Group>
            <Group gap="xs" mt="xs" align="flex-end" wrap="wrap">
              <TextInput
                label="Link-Bezeichnung"
                size="xs"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.currentTarget.value)}
                placeholder="z. B. Moodle-Abgabe"
                style={{ flex: 1, minWidth: 140 }}
              />
              <TextInput
                label="Link-Adresse"
                size="xs"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.currentTarget.value)}
                placeholder="https://…"
                style={{ flex: 2, minWidth: 180 }}
              />
              <Button size="xs" variant="default" onClick={addLink} leftSection={<IconPlus size={14} />}>
                Link hinzufügen
              </Button>
            </Group>
          </div>
        </>
      )}

      <Group justify="flex-end" gap="xs" mt="sm">
        <Button variant="default" onClick={() => onClose()} disabled={busy}>
          Abbrechen
        </Button>
        {cat && (
          <>
            <Button variant="light" onClick={() => void submit(false)} loading={busy}>
              Speichern
            </Button>
            <Button leftSection={<IconSend size={16} />} onClick={() => void submit(true)} loading={busy}>
              {isRevise ? 'Speichern und erneut einreichen' : 'Speichern und einreichen'}
            </Button>
          </>
        )}
      </Group>
    </Stack>
  )
}

/** Modal content for an opened entry with the actions its status allows. */
function EntryDetail({
  entry,
  onEdit,
  onClose,
}: {
  entry: PortfolioEntry
  onEdit: () => void
  onClose: () => void
}) {
  const status = useChangePortfolioStatus()
  const remove = useDeletePortfolioEntry()
  const markRead = useMarkPortfolioRead()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const marked = useRef(false)

  useEffect(() => {
    if (entry.unread && !marked.current) {
      marked.current = true
      markRead.mutate({ ids: [entry.id], courseid: entry.courseid })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per opened entry
  }, [entry.id, entry.unread])

  const change = (action: 'submit' | 'withdraw') =>
    status.mutate(
      { id: entry.id, action },
      {
        onSuccess: () =>
          notifications.show({
            color: 'teal',
            message:
              action === 'submit'
                ? 'Eingereicht – dein Lerncoach kann den Eintrag jetzt sehen.'
                : 'Zurückgezogen – der Eintrag ist wieder ein Entwurf.',
          }),
        onError: (e) => notifications.show({ color: 'red', title: 'Das hat nicht geklappt', message: errorMessage(e) }),
      },
    )

  const canWithdraw = entry.status === 'submitted' && entry.feedback.length === 0

  return (
    <Stack gap="md">
      <Group gap="xs">
        <PortfolioStatusBadge status={entry.status} />
      </Group>
      <PortfolioEntryView entry={entry} viewer="learner" />
      {confirmDelete ? (
        <Notice color="red" icon={<IconTrash />} title="Entwurf wirklich löschen?">
          <Group gap="xs" mt={4}>
            <Button
              size="xs"
              color="red"
              loading={remove.isPending}
              onClick={() =>
                remove.mutate(
                  { id: entry.id, courseid: entry.courseid },
                  {
                    onSuccess: () => {
                      notifications.show({ color: 'teal', message: 'Entwurf gelöscht.' })
                      onClose()
                    },
                    onError: (e) => notifications.show({ color: 'red', title: 'Nicht gelöscht', message: errorMessage(e) }),
                  },
                )
              }
            >
              Endgültig löschen
            </Button>
            <Button size="xs" variant="default" onClick={() => setConfirmDelete(false)}>
              Abbrechen
            </Button>
          </Group>
        </Notice>
      ) : (
        <Group justify="space-between" gap="xs">
          <Group gap="xs">
            {entry.status === 'draft' && (
              <Button variant="subtle" color="red" leftSection={<IconTrash size={16} />} onClick={() => setConfirmDelete(true)}>
                Löschen
              </Button>
            )}
            {canWithdraw && (
              <Button
                variant="subtle"
                leftSection={<IconArrowBackUp size={16} />}
                onClick={() => change('withdraw')}
                loading={status.isPending}
              >
                Zurückziehen
              </Button>
            )}
          </Group>
          <Group gap="xs">
            {isEditable(entry) && (
              <Button variant="default" leftSection={<IconEdit size={16} />} onClick={onEdit}>
                {entry.status === 'revise' ? 'Überarbeiten' : 'Bearbeiten'}
              </Button>
            )}
            {isEditable(entry) && (
              <Button leftSection={<IconSend size={16} />} onClick={() => change('submit')} loading={status.isPending}>
                {entry.status === 'revise' ? 'Erneut einreichen' : 'Einreichen'}
              </Button>
            )}
          </Group>
        </Group>
      )}
    </Stack>
  )
}

export function PortfolioPage() {
  const params = useParams()
  const courseid = Number(params.courseid)
  const entryid = Number(params.entryid ?? 0)
  const navigate = useNavigate()
  const portfolio = usePortfolio(courseid)
  const [category, setCategory] = useState<string>(ALL)
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [editor, setEditor] = useState<{ entry: PortfolioEntry | null; prefill?: PortfolioPrefill | null } | null>(
    () => {
      const prefill = parsePrefill(searchParams)
      return prefill ? { entry: null, prefill } : null
    },
  )

  // A pre-filled entry was opened from a link: drop the parameters so a reload does not open it again.
  useEffect(() => {
    if (searchParams.has('neu')) setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const entries = useMemo(() => portfolio.data?.entries ?? [], [portfolio.data])
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const e of entries) c[e.category] = (c[e.category] ?? 0) + 1
    return c
  }, [entries])
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter(
      (e) =>
        (category === ALL || e.category === category) &&
        (!q || [e.title, e.tags, ...e.fields.map((f) => f.value)].join(' ').toLowerCase().includes(q)),
    )
  }, [entries, category, search])

  if (portfolio.isPending) return <Loading />
  if (portfolio.isError) return <ErrorAlert error={portfolio.error} onRetry={() => portfolio.refetch()} />
  const data = portfolio.data
  const opened = entryid ? entries.find((e) => e.id === entryid) : undefined
  const closeEntry = () => navigate(`/portfolio/${courseid}`, { replace: true })
  const cat = category === ALL ? null : categoryInfo(category)
  const drafts = entries.filter((e) => e.status === 'draft').length
  const unread = entries.filter((e) => e.unread).length
  const revise = entries.filter((e) => e.status === 'revise').length

  return (
    <>
      <Breadcrumbs mb="xs">
        <Anchor component={Link} to="/portfolio" size="sm">
          Portfolio
        </Anchor>
        <Text size="sm">{data.course.fullname}</Text>
      </Breadcrumbs>
      <PageHeader
        title="Portfolio"
        description={data.course.fullname}
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={() => setEditor({ entry: null })}>
            Neuer Eintrag
          </Button>
        }
      />

      <Stack gap="md">
        <Notice color="blue" icon={<IconInfoCircle />}>
          Sammle hier, was deinen Lernweg zeigt. <b>Entwürfe</b> kannst du in Ruhe bearbeiten. Sobald du einen Eintrag{' '}
          <b>einreichst</b>, sieht ihn dein Lerncoach in diesem Kurs und kann dir eine Rückmeldung geben. Alles wird in
          Moodle gespeichert.
        </Notice>

        {(unread > 0 || revise > 0 || drafts > 0) && (
          <Group gap="xs">
            {unread > 0 && (
              <Badge color="yellow" c="dark" styles={{ label: { textTransform: 'none' } }}>
                {unread} neue {unread === 1 ? 'Rückmeldung' : 'Rückmeldungen'}
              </Badge>
            )}
            {revise > 0 && (
              <Badge color="orange" variant="light" styles={{ label: { textTransform: 'none' } }}>
                {revise} zu überarbeiten
              </Badge>
            )}
            {drafts > 0 && (
              <Badge color="gray" variant="light" styles={{ label: { textTransform: 'none' } }}>
                {drafts} {drafts === 1 ? 'Entwurf' : 'Entwürfe'}
              </Badge>
            )}
          </Group>
        )}

        <Chip.Group value={category} onChange={(v) => setCategory(String(v))}>
          <Group gap={6} role="group" aria-label="Register">
            <Chip value={ALL} size="sm">
              Alle ({entries.length})
            </Chip>
            {PORTFOLIO_CATEGORIES.map((c) => (
              <Chip key={c.key} value={c.key} size="sm" color={c.color}>
                {c.label} ({counts[c.key] ?? 0})
              </Chip>
            ))}
          </Group>
        </Chip.Group>

        <Group justify="space-between" gap="xs" wrap="wrap">
          <Text size="sm" c="dimmed" style={{ flex: 1, minWidth: 200 }}>
            {cat ? cat.hint : 'Alle Einträge, zuletzt geänderte zuerst.'}
          </Text>
          <TextInput
            aria-label="Einträge durchsuchen"
            placeholder="Suchen …"
            leftSection={<IconSearch size={14} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={220}
          />
        </Group>

        {visible.length === 0 ? (
          <Card withBorder radius="md" padding="lg">
            <Stack align="center" gap="xs">
              <Text fw={600}>{search ? 'Nichts gefunden' : 'Noch keine Einträge'}</Text>
              <Text size="sm" c="dimmed" ta="center">
                {search
                  ? 'Versuche einen anderen Suchbegriff.'
                  : `Lege deinen ersten Eintrag an${cat ? ` in „${cat.label}“` : ', zum Beispiel ein Arbeitsergebnis oder eine Reflexion'}.`}
              </Text>
              {!search && (
                <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => setEditor({ entry: null })}>
                  Neuer Eintrag
                </Button>
              )}
            </Stack>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {visible.map((e) => (
              <EntryCard key={e.id} entry={e} onOpen={() => navigate(`/portfolio/${courseid}/${e.id}`)} />
            ))}
          </SimpleGrid>
        )}
      </Stack>

      <Modal
        opened={!!opened && !editor}
        onClose={closeEntry}
        title={opened?.title}
        size="lg"
        styles={{ title: { fontWeight: 700 } }}
      >
        {opened && <EntryDetail entry={opened} onEdit={() => setEditor({ entry: opened })} onClose={closeEntry} />}
      </Modal>

      <Modal
        opened={!!editor}
        onClose={() => setEditor(null)}
        title={editor?.entry ? `${categoryInfo(editor.entry.category).one} bearbeiten` : 'Neuer Eintrag'}
        size="lg"
        closeOnClickOutside={false}
        styles={{ title: { fontWeight: 700 } }}
      >
        {editor && (
          <EntryEditor
            courseid={courseid}
            entry={editor.entry ? (entries.find((e) => e.id === editor.entry!.id) ?? editor.entry) : null}
            initialCategory={cat?.key ?? null}
            prefill={editor.prefill}
            maxfilesize={data.maxfilesize}
            onClose={(savedId) => {
              setEditor(null)
              if (savedId && !editor.entry) navigate(`/portfolio/${courseid}/${savedId}`, { replace: true })
            }}
          />
        )}
      </Modal>
    </>
  )
}
