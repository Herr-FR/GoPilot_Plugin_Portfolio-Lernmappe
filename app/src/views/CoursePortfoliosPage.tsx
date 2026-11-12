import {
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Chip,
  Group,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconSearch, IconSend } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { errorMessage } from '../api/client'
import { useAddPortfolioFeedback, useCoursePortfolios } from '../api/hooks'
import type { PortfolioEntry, PortfolioFeedbackStatus } from '../api/types'
import { PageHeader } from '../components/PageHeader'
import { PortfolioEntryView, PortfolioStatusBadge } from '../components/PortfolioEntryView'
import { ErrorAlert, Loading } from '../components/QueryState'
import { categoryInfo } from '../lib/portfolio'
import { formatDateTime } from '../lib/week'

const FEEDBACK_STATUSES: { value: PortfolioFeedbackStatus; label: string }[] = [
  { value: 'feedback', label: 'Rückmeldung geben' },
  { value: 'revise', label: 'Bitte überarbeiten' },
  { value: 'done', label: 'Abgeschlossen' },
]

/** Feedback form of the coach under an entry. */
function FeedbackForm({ entry }: { entry: PortfolioEntry }) {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<PortfolioFeedbackStatus>('feedback')
  const add = useAddPortfolioFeedback()

  const send = () => {
    const text = message.trim()
    if (!text && status !== 'done') {
      notifications.show({ color: 'red', message: 'Bitte schreibe eine Rückmeldung.' })
      return
    }
    add.mutate(
      { id: entry.id, message: text, status },
      {
        onSuccess: () => {
          setMessage('')
          notifications.show({ color: 'teal', message: 'Rückmeldung gesendet.' })
        },
        onError: (e) => notifications.show({ color: 'red', title: 'Nicht gesendet', message: errorMessage(e) }),
      },
    )
  }

  return (
    <Stack gap="xs">
      <Textarea
        label="Rückmeldung"
        placeholder="Was ist gelungen? Was ist der nächste Schritt? Welche Frage hilft beim Weiterdenken?"
        autosize
        minRows={2}
        value={message}
        onChange={(e) => setMessage(e.currentTarget.value)}
      />
      <Group gap="xs" align="flex-end" wrap="wrap">
        <Select
          label="Status"
          data={FEEDBACK_STATUSES}
          value={status}
          onChange={(v) => v && setStatus(v as PortfolioFeedbackStatus)}
          allowDeselect={false}
          w={220}
        />
        <Button leftSection={<IconSend size={16} />} onClick={send} loading={add.isPending}>
          Senden
        </Button>
      </Group>
    </Stack>
  )
}

/** One submitted entry with its content and the feedback form. */
function CoachEntryCard({ entry, showLearner }: { entry: PortfolioEntry; showLearner: boolean }) {
  const cat = categoryInfo(entry.category)
  return (
    <Card withBorder radius="md" padding="md">
      <Stack gap="sm">
        <Group justify="space-between" gap="xs" wrap="wrap">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon color={cat.color} variant="light" size={28} radius="md" aria-hidden>
              <cat.icon size={16} />
            </ThemeIcon>
            <div style={{ minWidth: 0 }}>
              <Text fw={700} component="h3" m={0} size="md">
                {entry.title}
              </Text>
              {showLearner && (
                <Anchor component={Link} to={`/lerndoku/${entry.courseid}/${entry.userid}/portfolio`} size="xs">
                  {entry.learnername}
                </Anchor>
              )}
            </div>
          </Group>
          <PortfolioStatusBadge status={entry.status} viewer="coach" />
        </Group>
        <PortfolioEntryView entry={entry} viewer="coach" />
        <FeedbackForm entry={entry} />
      </Stack>
    </Card>
  )
}

/** Lerncoach: learners of a course with their portfolios, open submissions first. */
export function CoursePortfoliosPage() {
  const courseid = Number(useParams().courseid)
  const data = useCoursePortfolios(courseid, 0)
  const [search, setSearch] = useState('')
  const [openOnly, setOpenOnly] = useState(true)

  const learners = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...(data.data?.learners ?? [])]
      .filter((l) => !q || l.fullname.toLowerCase().includes(q))
      .sort((a, b) => b.open - a.open || b.lastsubmitted - a.lastsubmitted || a.fullname.localeCompare(b.fullname))
  }, [data.data, search])

  if (data.isPending) return <Loading />
  if (data.isError) return <ErrorAlert error={data.error} onRetry={() => data.refetch()} />
  const { course } = data.data
  const open = data.data.entries.filter((e) => e.status === 'submitted')
  const shown = openOnly ? open : data.data.entries

  return (
    <>
      <Breadcrumbs mb="xs">
        <Anchor component={Link} to={`/lerndoku/${courseid}`} size="sm">
          Lerndoku {course.fullname}
        </Anchor>
        <Text size="sm">Portfolios</Text>
      </Breadcrumbs>
      <PageHeader
        title="Portfolios"
        description={`${course.fullname} · Du siehst nur eingereichte Einträge, keine Entwürfe.`}
      />

      <Stack gap="lg">
        <div>
          <Group justify="space-between" mb="xs" wrap="wrap" gap="xs">
            <Text fw={700}>Lernende</Text>
            <TextInput
              aria-label="Lernende suchen"
              placeholder="Name suchen …"
              leftSection={<IconSearch size={14} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              w={220}
            />
          </Group>
          <Table.ScrollContainer minWidth={560}>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Eingereicht</Table.Th>
                  <Table.Th>Offen</Table.Th>
                  <Table.Th>Zu überarbeiten</Table.Th>
                  <Table.Th>Abgeschlossen</Table.Th>
                  <Table.Th>Zuletzt eingereicht</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {learners.map((l) => (
                  <Table.Tr key={l.id}>
                    <Table.Td>
                      <Anchor component={Link} to={`/lerndoku/${courseid}/${l.id}/portfolio`} fw={600} size="sm">
                        {l.fullname}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>{l.total}</Table.Td>
                    <Table.Td>
                      {l.open > 0 ? (
                        <Badge size="sm" color="blue" styles={{ label: { textTransform: 'none' } }}>
                          {l.open} neu
                        </Badge>
                      ) : (
                        0
                      )}
                    </Table.Td>
                    <Table.Td>{l.revise}</Table.Td>
                    <Table.Td>{l.done}</Table.Td>
                    <Table.Td>{l.lastsubmitted ? formatDateTime(l.lastsubmitted) : '–'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </div>

        <div>
          <Group justify="space-between" mb="xs" wrap="wrap" gap="xs">
            <Text fw={700}>Einträge</Text>
            <Chip checked={openOnly} onChange={setOpenOnly} size="sm">
              Nur neu eingereichte ({open.length})
            </Chip>
          </Group>
          {shown.length === 0 ? (
            <Text c="dimmed" size="sm">
              {openOnly ? 'Keine neu eingereichten Einträge.' : 'Noch keine eingereichten Einträge.'}
            </Text>
          ) : (
            <Stack gap="md">
              {shown.map((e) => (
                <CoachEntryCard key={e.id} entry={e} showLearner />
              ))}
            </Stack>
          )}
        </div>
      </Stack>
    </>
  )
}

/** Lerncoach: the submitted portfolio entries of one learner. */
export function LearnerPortfolioPage() {
  const params = useParams()
  const courseid = Number(params.courseid)
  const userid = Number(params.userid)
  const data = useCoursePortfolios(courseid, userid)

  if (data.isPending) return <Loading />
  if (data.isError) return <ErrorAlert error={data.error} onRetry={() => data.refetch()} />
  const learner = data.data.learners.find((l) => l.id === userid)
  const name = learner?.fullname ?? 'Lernende:r'

  return (
    <>
      <Breadcrumbs mb="xs">
        <Anchor component={Link} to={`/lerndoku/${courseid}`} size="sm">
          Lerndoku {data.data.course.fullname}
        </Anchor>
        <Anchor component={Link} to={`/lerndoku/${courseid}/${userid}`} size="sm">
          {name}
        </Anchor>
        <Text size="sm">Portfolio</Text>
      </Breadcrumbs>
      <PageHeader
        title={`Portfolio von ${name}`}
        description="Eingereichte Einträge, neu eingereichte zuerst. Entwürfe siehst du nicht."
        actions={
          <Button component={Link} to={`/lerndoku/${courseid}/portfolio`} variant="default">
            Alle Portfolios
          </Button>
        }
      />
      {data.data.entries.length === 0 ? (
        <Text c="dimmed">Noch keine eingereichten Einträge.</Text>
      ) : (
        <Stack gap="md">
          {data.data.entries.map((e) => (
            <CoachEntryCard key={e.id} entry={e} showLearner={false} />
          ))}
        </Stack>
      )}
    </>
  )
}
