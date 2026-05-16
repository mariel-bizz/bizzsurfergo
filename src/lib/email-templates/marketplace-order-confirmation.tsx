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
  items?: OrderItem[]
}

export function MarketplaceOrderConfirmationEmail({
  name = '',
  items = [],
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>We received your marketplace order request</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
          <Heading style={{ color: '#0f172a', fontSize: 22, marginBottom: 8 }}>
            ✅ {name ? `Thanks, ${name}!` : 'Thanks for your request!'}
          </Heading>
          <Text style={{ color: '#334155', fontSize: 14, lineHeight: 1.6 }}>
            We've received your marketplace order request and a member of our team
            will reach out from <b>info@bizzsurfer.com</b> within 1 business day to
            confirm details and next steps.
          </Text>
          <Section style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 14 }}><b>Items in your request ({items.length})</b></Text>
            {items.map((it, i) => (
              <Text key={i} style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}>
                • {it.title} <span style={{ color: '#64748b' }}>— {it.provider}</span>
              </Text>
            ))}
          </Section>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
            BizzSurfer Go! — Agentic AI marketplace
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: MarketplaceOrderConfirmationEmail,
  subject: 'We received your BizzSurfer marketplace request',
  displayName: 'Marketplace Order Confirmation',
  previewData: {
    name: 'Alex',
    items: [
      { title: 'Revenue Ops Copilot', provider: 'Acme AI', category: 'agents' },
    ],
  },
} satisfies TemplateEntry
