import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  email?: string
  company?: string | null
  offeringType?: string
  title?: string
  description?: string
  website?: string | null
}

export function MarketplaceListingApplicationEmail({
  name = '',
  email = '',
  company = null,
  offeringType = '',
  title = '',
  description = '',
  website = null,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New marketplace listing application: {title}</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
          <Heading style={{ color: '#0f172a', fontSize: 22, marginBottom: 8 }}>
            🚀 New marketplace listing application
          </Heading>
          <Section style={{ background: '#ffffff', borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Name:</b> {name}</Text>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Email:</b> {email}</Text>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Company:</b> {company || '—'}</Text>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Offering type:</b> {offeringType}</Text>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Title:</b> {title}</Text>
            <Text style={{ margin: '4px 0', color: '#0f172a', fontSize: 14 }}><b>Website:</b> {website || '—'}</Text>
          </Section>
          <Section style={{ background: '#ffffff', borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ margin: '0 0 6px', color: '#0f172a', fontSize: 14 }}><b>Description</b></Text>
            <Text style={{ margin: 0, color: '#0f172a', fontSize: 14, whiteSpace: 'pre-wrap' }}>{description}</Text>
          </Section>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
            BizzSurfer Go! marketplace application
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: MarketplaceListingApplicationEmail,
  subject: (data: Record<string, any>) =>
    `New marketplace listing: ${data.title || data.name || 'unknown'}`,
  displayName: 'Marketplace Listing Application',
  to: 'info@bizzsurfer.com',
  previewData: {
    name: 'Alex Doe',
    email: 'alex@example.com',
    company: 'Acme AI',
    offeringType: 'Agent',
    title: 'Revenue Ops Copilot',
    description: 'An agent that automates pipeline hygiene and deal scoring for B2B sales teams.',
    website: 'https://acme.ai/revops',
  },
} satisfies TemplateEntry
