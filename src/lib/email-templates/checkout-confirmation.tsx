import * as React from 'react'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  tierLabel?: string
  billingPeriod?: 'monthly' | 'yearly' | null
  quantity?: number
  amountFormatted?: string
  receiptUrl?: string | null
  manageUrl?: string
}

const TIER_LABELS: Record<string, string> = {
  hero: 'BizzSurfer Go! Hero',
  champion: 'BizzSurfer Go! Champion',
  team: 'BizzSurfer Team',
}

export function CheckoutConfirmationEmail({
  name = '',
  tierLabel = 'Your subscription',
  billingPeriod = null,
  quantity = 1,
  amountFormatted = '',
  receiptUrl,
  manageUrl = 'https://go.bizzsurfer.ai/profile',
}: Props) {
  const periodLabel =
    billingPeriod === 'yearly' ? 'Annual billing' : billingPeriod === 'monthly' ? 'Monthly billing' : 'Subscription'
  const isTeam = tierLabel.toLowerCase().includes('team')
  return (
    <Html>
      <Head />
      <Preview>{`Welcome to ${tierLabel} — your payment is confirmed`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
          <Heading style={{ color: '#0f172a', fontSize: 24, marginBottom: 8 }}>
            {name ? `Thanks, ${name}!` : 'Thank you for your purchase!'}
          </Heading>
          <Text style={{ color: '#334155', fontSize: 14, lineHeight: 1.6 }}>
            Your payment has been confirmed. You now have full access to {tierLabel}.
          </Text>

          <Section style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginTop: 16 }}>
            <Text style={{ margin: '0 0 4px', color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Plan
            </Text>
            <Text style={{ margin: '0 0 12px', color: '#0f172a', fontSize: 18, fontWeight: 700 }}>{tierLabel}</Text>

            <Hr style={{ borderColor: '#e2e8f0', margin: '12px 0' }} />

            <Text style={{ margin: '6px 0', color: '#0f172a', fontSize: 14 }}>
              <b>Billing:</b> {periodLabel}
            </Text>
            {isTeam && (
              <Text style={{ margin: '6px 0', color: '#0f172a', fontSize: 14 }}>
                <b>Seats:</b> {quantity}
              </Text>
            )}
            {amountFormatted && (
              <Text style={{ margin: '6px 0', color: '#0f172a', fontSize: 14 }}>
                <b>Amount charged:</b> {amountFormatted}
              </Text>
            )}
          </Section>

          <Section style={{ textAlign: 'center', marginTop: 24 }}>
            <Button
              href={manageUrl}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Manage subscription
            </Button>
          </Section>

          {receiptUrl && (
            <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
              <a href={receiptUrl} style={{ color: '#2563eb' }}>View official Stripe receipt</a>
            </Text>
          )}

          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
            BizzSurfer Go! — Agentic AI for transformation teams
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: CheckoutConfirmationEmail,
  subject: (d: Record<string, any>) => `Welcome to ${d?.tierLabel ?? 'BizzSurfer Go!'} — payment confirmed`,
  displayName: 'Checkout Confirmation',
  previewData: {
    name: 'Alex',
    tierLabel: 'BizzSurfer Team',
    billingPeriod: 'yearly',
    quantity: 5,
    amountFormatted: '€670.50',
    manageUrl: 'https://go.bizzsurfer.ai/profile',
  },
} satisfies TemplateEntry

export const TIER_EMAIL_LABELS = TIER_LABELS
