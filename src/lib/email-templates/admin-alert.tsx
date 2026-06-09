import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  kind?: string
  severity?: 'warning' | 'critical'
  title?: string
  message?: string
  metadata?: Record<string, unknown>
}

export function AdminAlertEmail({
  kind = 'unknown',
  severity = 'warning',
  title = 'Admin alert',
  message = '',
  metadata = {},
}: Props) {
  const accent = severity === 'critical' ? '#dc2626' : '#d97706'
  return (
    <Html>
      <Head />
      <Preview>{`[${severity.toUpperCase()}] ${title}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
          <Text style={{ color: accent, fontSize: 12, fontWeight: 700, letterSpacing: 1, margin: 0 }}>
            {severity.toUpperCase()} · {kind}
          </Text>
          <Heading style={{ color: '#0f172a', fontSize: 22, marginTop: 6, marginBottom: 10 }}>
            {title}
          </Heading>
          <Text style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{message}</Text>
          <Section style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 13, fontWeight: 700 }}>Details</Text>
            <Text style={{ margin: 0, color: '#0f172a', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(metadata, null, 2)}
            </Text>
          </Section>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
            BizzSurfer Go! — system alert
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AdminAlertEmail,
  subject: (d: Record<string, any>) => `[${String(d?.severity ?? 'warning').toUpperCase()}] ${d?.title ?? 'Admin alert'}`,
  displayName: 'Admin Alert',
  previewData: {
    kind: 'webhook_missing_tier',
    severity: 'warning',
    title: 'Stripe webhook wrote a subscription without tier_id',
    message: 'A subscription event was received but tier_id or quantity could not be resolved.',
    metadata: { stripe_subscription_id: 'sub_123', price_id: 'unknown' },
  },
} satisfies TemplateEntry
