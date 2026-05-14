import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  email?: string
  role?: string | null
  company?: string | null
  source?: string | null
}

export function WaitlistAdminNotificationEmail({
  name = 'New signup',
  email = '',
  role = null,
  company = null,
  source = null,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New BizzSurfer waitlist signup: {name}</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
          <Heading style={{ color: '#0f172a', fontSize: 22, marginBottom: 8 }}>📥 New waitlist signup</Heading>
          <Section style={{ background: '#ffffff', borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Name:</b> {name}</Text>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Email:</b> {email}</Text>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Role:</b> {role || '—'}</Text>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Company:</b> {company || '—'}</Text>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Source:</b> {source || 'direct'}</Text>
          </Section>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
            BizzSurfer Go! internal notification
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WaitlistAdminNotificationEmail,
  subject: (data: Record<string, any>) => `New waitlist signup: ${data.name || 'unknown'}`,
  displayName: 'Waitlist Admin Notification',
  to: 'marketing@bizzsurfer.com',
  previewData: { name: 'Mariel Schaab', email: 'mariel@example.com', role: 'CTO', company: 'Acme', source: 'home_hero' },
} satisfies TemplateEntry
