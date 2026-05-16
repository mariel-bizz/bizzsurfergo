import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  title?: string
  offeringType?: string
  statusUrl?: string
}

export function MarketplaceListingApplicationConfirmationEmail({
  name = 'there',
  title = 'your offering',
  offeringType = '',
  statusUrl = 'https://go.bizzsurfer.ai',
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>We received your BizzSurfer marketplace application</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
          <Heading style={{ color: '#0f172a', fontSize: 22, marginBottom: 12 }}>
            Thanks, {name} — application received
          </Heading>
          <Text style={{ color: '#334155', fontSize: 14, lineHeight: 1.6 }}>
            We've received your application to list <b>{title}</b>{offeringType ? ` (${offeringType})` : ''} on the BizzSurfer Go! marketplace.
          </Text>
          <Text style={{ color: '#334155', fontSize: 14, lineHeight: 1.6 }}>
            Our team will review your submission within 3–5 business days and reach out at this email address with next steps.
          </Text>
          <Section style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginTop: 16 }}>
            <Text style={{ margin: 0, color: '#0f172a', fontSize: 14 }}>
              <b>Track your application status anytime:</b>
            </Text>
            <Button
              href={statusUrl}
              style={{
                display: 'inline-block',
                marginTop: 12,
                backgroundColor: '#02459c',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              View application status
            </Button>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 10, wordBreak: 'break-all' }}>
              Or copy this link: {statusUrl}
            </Text>
          </Section>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
            BizzSurfer Go! • info@bizzsurfer.com
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: MarketplaceListingApplicationConfirmationEmail,
  subject: 'We received your BizzSurfer marketplace application',
  displayName: 'Marketplace Application Confirmation',
  previewData: {
    name: 'Alex',
    title: 'Revenue Ops Copilot',
    offeringType: 'Agent',
    statusUrl: 'https://go.bizzsurfer.ai/marketplace/application/00000000-0000-0000-0000-000000000000',
  },
} satisfies TemplateEntry
