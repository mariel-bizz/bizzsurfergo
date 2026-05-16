import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface OrderItem {
  title: string
  provider: string
  category: string
}

interface Props {
  name?: string
  email?: string
  company?: string | null
  phone?: string | null
  message?: string | null
  items?: OrderItem[]
}

export function MarketplaceOrderRequestEmail({
  name = '',
  email = '',
  company = null,
  phone = null,
  message = null,
  items = [],
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New marketplace order request from {name}</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
          <Heading style={{ color: '#0f172a', fontSize: 22, marginBottom: 8 }}>
            🛒 New marketplace order request
          </Heading>
          <Section style={{ background: '#ffffff', borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Name:</b> {name}</Text>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Email:</b> {email}</Text>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Company:</b> {company || '—'}</Text>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Phone:</b> {phone || '—'}</Text>
          </Section>
          <Section style={{ background: '#ffffff', borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 14 }}><b>Items requested ({items.length})</b></Text>
            {items.map((it, i) => (
              <Text key={i} style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}>
                • {it.title} <span style={{ color: '#64748b' }}>— {it.provider} ({it.category})</span>
              </Text>
            ))}
          </Section>
          {message ? (
            <Section style={{ background: '#ffffff', borderRadius: 12, padding: 16, marginTop: 12 }}>
              <Text style={{ margin: '0 0 6px', color: '#0f172a', fontSize: 14 }}><b>Message</b></Text>
              <Text style={{ margin: 0, color: '#0f172a', fontSize: 14, whiteSpace: 'pre-wrap' }}>{message}</Text>
            </Section>
          ) : null}
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
            BizzSurfer Go! marketplace order request
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: MarketplaceOrderRequestEmail,
  subject: (data: Record<string, any>) =>
    `New marketplace order from ${data.name || data.email || 'unknown'}`,
  displayName: 'Marketplace Order Request',
  to: 'info@bizzsurfer.com',
  previewData: {
    name: 'Alex Doe',
    email: 'alex@example.com',
    company: 'Acme AI',
    phone: '+1 555 123 4567',
    message: 'Please send pricing and onboarding details.',
    items: [
      { title: 'Revenue Ops Copilot', provider: 'Acme AI', category: 'agents' },
      { title: 'Pipeline Audit', provider: 'BizzSurfer Services', category: 'services' },
    ],
  },
} satisfies TemplateEntry
