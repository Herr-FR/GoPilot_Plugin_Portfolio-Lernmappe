import { Anchor, Badge, Button, Group, Paper, Stack, Text } from '@mantine/core'
import { IconExternalLink, IconFile, IconLink, IconMessageCircle } from '@tabler/icons-react'
import type { PortfolioEntry, PortfolioStatus } from '../api/types'
import { selfAssessmentLabel, SELF_ASSESSMENT_LEVELS, ampelDisplay } from '../lib/ampel'
import { openInMoodle } from '../lib/moodle'
import { categoryInfo, fieldValue, formatEntryDate, formatFileSize, PORTFOLIO_STATUS } from '../lib/portfolio'
import { formatDate, formatDateTime } from '../lib/week'

/** Status badge; `viewer` switches between learner and coach wording. */
export function PortfolioStatusBadge({ status, viewer = 'learner' }: { status: PortfolioStatus; viewer?: 'learner' | 'coach' }) {
  const s = PORTFOLIO_STATUS[status]
  return (
    <Badge size="sm" variant="light" color={s.color} styles={{ label: { textTransform: 'none' } }}>
      {viewer === 'coach' ? s.coachLabel : s.label}
    </Badge>
  )
}

/** Read-only content of a portfolio entry: answers, self-assessment, attachments, links and feedback. */
export function PortfolioEntryView({ entry, viewer }: { entry: PortfolioEntry; viewer: 'learner' | 'coach' }) {
  const cat = categoryInfo(entry.category)
  const known = new Set(cat.questions.map((q) => q.key))
  const extra = entry.fields.filter((f) => !known.has(f.key) && f.value)
  const level = SELF_ASSESSMENT_LEVELS.find((l) => l.value === entry.selflevel)
  const hasAnswers = cat.questions.some((q) => fieldValue(entry.fields, q.key)) || extra.length > 0

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {[
          cat.one,
          formatEntryDate(entry.entrydate),
          entry.revision > 1 ? `Version ${entry.revision}` : '',
          entry.timesubmitted ? `eingereicht am ${formatDateTime(entry.timesubmitted)}` : '',
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>

      {!hasAnswers && (
        <Text size="sm" c="dimmed">
          Noch keine Antworten auf die Leitfragen.
        </Text>
      )}
      {cat.questions.map((q) => {
        const v = fieldValue(entry.fields, q.key)
        if (!v) return null
        return (
          <div key={q.key}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              {q.label}
            </Text>
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {v}
            </Text>
          </div>
        )
      })}
      {extra.map((f) => (
        <div key={f.key}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            {f.key}
          </Text>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {f.value}
          </Text>
        </div>
      ))}

      {entry.selflevel > 0 && (
        <Group gap={6}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            Selbsteinschätzung
          </Text>
          <Badge
            size="sm"
            variant="light"
            color={ampelDisplay(level?.colour ?? 'none').color}
            c={level?.colour === 'yellow' ? 'yellow.9' : undefined}
            styles={{ label: { textTransform: 'none' } }}
          >
            {selfAssessmentLabel(entry.selflevel)}
          </Badge>
        </Group>
      )}
      {entry.tags && (
        <Text size="sm">
          <Text span size="xs" fw={700} c="dimmed" tt="uppercase">
            Schlagworte{' '}
          </Text>
          {entry.tags}
        </Text>
      )}

      {(entry.files.length > 0 || entry.links.length > 0) && (
        <Stack gap={6}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            Anhänge und Links
          </Text>
          {entry.files.map((f) => (
            <Group key={f.id} gap="xs" wrap="nowrap">
              <IconFile size={16} aria-hidden style={{ flexShrink: 0 }} />
              <Text size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
                {f.filename}{' '}
                <Text span size="xs" c="dimmed">
                  ({formatFileSize(f.filesize)})
                </Text>
              </Text>
              <Button
                size="compact-xs"
                variant="light"
                rightSection={<IconExternalLink size={12} />}
                onClick={() => void openInMoodle(f.url)}
                aria-label={`${f.filename} in Moodle öffnen`}
              >
                Öffnen
              </Button>
            </Group>
          ))}
          {entry.links.map((l, i) => (
            <Group key={`${l.url}-${i}`} gap="xs" wrap="nowrap">
              <IconLink size={16} aria-hidden style={{ flexShrink: 0 }} />
              <Anchor href={l.url} target="_blank" rel="noopener noreferrer" size="sm" truncate>
                {l.label || l.url}
              </Anchor>
            </Group>
          ))}
        </Stack>
      )}

      {entry.feedback.length > 0 && (
        <Stack gap="xs">
          <Group gap={6}>
            <IconMessageCircle size={16} aria-hidden />
            <Text size="sm" fw={700}>
              {viewer === 'coach' ? 'Rückmeldungen' : 'Rückmeldungen deines Lerncoachs'}
            </Text>
          </Group>
          {entry.feedback.map((f) => (
            <Paper key={f.id} withBorder p="xs" radius="md" bg="var(--mantine-color-gray-light)">
              <Group justify="space-between" gap="xs" mb={4} wrap="wrap">
                <Text size="xs" fw={600}>
                  {f.authorname}
                </Text>
                <Group gap={6}>
                  <PortfolioStatusBadge status={f.status} viewer={viewer} />
                  <Text size="xs" c="dimmed">
                    {formatDate(f.timecreated)}
                    {f.revision > 0 ? ` · zu Version ${f.revision}` : ''}
                  </Text>
                </Group>
              </Group>
              {f.message && (
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {f.message}
                </Text>
              )}
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
