import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  recipientEmail?: string
  sentAt?: string
}

const TestDeliveryEmail = ({ recipientEmail, sentAt }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Bizzsurfer email delivery test — if you can read this, sending works</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Email delivery looks good ✅</Heading>
        <Text style={text}>
          This is a test from <strong>notify.go.bizzsurfer.ai</strong>. If it
          landed in your inbox, sending, DNS, DKIM and branding are all
          working.
        </Text>
        <Section style={card}>
          <Text style={small}>Recipient: {recipientEmail ?? '—'}</Text>
          <Text style={small}>Sent at: {sentAt ?? new Date().toISOString()}</Text>
        </Section>
        <Button style={button} href="https://go.bizzsurfer.ai/admin/emails">
          Open delivery log
        </Button>
        <Text style={footer}>Bizzsurfer · go.bizzsurfer.ai</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TestDeliveryEmail,
  subject: 'Bizzsurfer email delivery test',
  displayName: 'Email delivery test',
  previewData: { recipientEmail: 'you@example.com', sentAt: new Date().toISOString() },
} satisfies TemplateEntry

export default TestDeliveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: '#0b1220', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.55', margin: '0 0 20px' }
const card = {
  background: '#f1f5f9',
  borderRadius: '10px',
  padding: '14px 16px',
  margin: '0 0 24px',
}
const small = { fontSize: '13px', color: '#475569', margin: '4px 0' }
const button = {
  backgroundColor: '#0b1220',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 18px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#94a3b8', margin: '28px 0 0' }
