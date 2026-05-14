import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
}

export function WaitlistConfirmationEmail({ name = 'there' }: Props) {
  return (
    <Html>
      <Head />
      <Preview>You're on the BizzSurfer Agentic AI waitlist</Preview>
      <Body style={{ backgroundColor: '#fff7ed', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
          <Heading style={{ color: '#ea580c', fontSize: 24, marginBottom: 8 }}>You're on the list, {name} 🚀</Heading>
          <Section style={{ background: '#ffffff', borderRadius: 12, padding: 16, marginTop: 16 }}>
            <Text style={{ color: '#0f172a', fontSize: 15, margin: 0 }}>
              Thanks for joining the BizzSurfer Agentic AI waitlist. You'll be among the first to hear when we launch — and we'll share early access plus a 90-day adoption playbook for executives.
            </Text>
            <Text style={{ color: '#475569', fontSize: 14, marginTop: 16 }}>
              In the meantime, reply to this email if you'd like to chat about your AI transformation roadmap.
            </Text>
          </Section>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 32, textAlign: 'center' }}>
            BizzSurfer Go! — Agentic AI for Business Transformation
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WaitlistConfirmationEmail,
  subject: "You're on the BizzSurfer waitlist 🚀",
  displayName: 'Waitlist Confirmation',
  previewData: { name: 'Mariel' },
} satisfies TemplateEntry
