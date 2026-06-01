import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'BizzSurfer GO!'
const TEAM_INBOX = 'hello@bizzsurfer.com'

interface ContactNotificationProps {
  name?: string
  role?: string
  company?: string
  email?: string
  phone?: string
  topic?: string
  message?: string
  submittedAt?: string
}

const ContactFormAdminNotification = ({
  name,
  role,
  company,
  email,
  phone,
  topic,
  message,
  submittedAt,
}: ContactNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form submission from {name ?? 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New contact message</Heading>
        <Text style={text}>
          Someone just reached out through the {SITE_NAME} contact form.
        </Text>

        <Section style={card}>
          <Row label="Name" value={name} />
          <Row label="Role" value={role} />
          <Row label="Company" value={company} />
          <Row label="Email" value={email} />
          <Row label="Phone" value={phone} />
          <Row label="Topic" value={topic} />
          {submittedAt ? <Row label="Submitted at" value={submittedAt} /> : null}
        </Section>

        <Heading as="h2" style={h2}>Message</Heading>
        <Text style={messageBlock}>{message}</Text>

        <Hr style={hr} />
        <Text style={footer}>
          This notification was sent to {TEAM_INBOX}.
        </Text>
      </Container>
    </Body>
  </Html>
)

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <Text style={rowText}>
      <strong style={rowLabel}>{label}:</strong> {value ?? '—'}
    </Text>
  )
}

export const template = {
  component: ContactFormAdminNotification,
  subject: (data: Record<string, any>) =>
    `New contact: ${data?.name ?? 'visitor'}${data?.topic ? ` — ${data.topic}` : ''}`,
  displayName: 'Contact form — team notification',
  to: TEAM_INBOX,
  previewData: {
    name: 'Jane Doe',
    role: 'COO',
    company: 'Acme Inc.',
    email: 'jane@acme.com',
    phone: '+1 555 123 4567',
    topic: 'Partnership',
    message: 'Hi! We would love to explore a partnership with BizzSurfer.',
    submittedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main: React.CSSProperties = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container: React.CSSProperties = { padding: '24px 28px', maxWidth: '600px' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const h2: React.CSSProperties = { fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '24px 0 8px' }
const text: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 16px' }
const card: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '16px 18px',
  margin: '12px 0',
}
const rowText: React.CSSProperties = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const rowLabel: React.CSSProperties = { color: '#64748b', marginRight: '6px' }
const messageBlock: React.CSSProperties = {
  fontSize: '14px',
  color: '#0f172a',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '14px 16px',
  margin: '0 0 16px',
}
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '24px 0 12px' }
const footer: React.CSSProperties = { fontSize: '12px', color: '#94a3b8', margin: 0 }
