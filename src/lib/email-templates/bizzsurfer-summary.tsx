import * as React from 'react'
import {
  Body,
  Button,
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

interface SummaryProps {
  focus?: string
  modelUsed?: string
  question?: string
  excerpt?: string
  upgradeUrl?: string
}

export function BizzSurferSummaryEmail({
  focus = 'Your transformation focus',
  modelUsed = 'BizzSurfer Go!',
  question = 'Your question',
  excerpt = 'Your AI-generated insight excerpt.',
  upgradeUrl = 'https://go.bizzsurfer.ai/pricing',
}: SummaryProps) {
  return (
    <Html>
      <Head />
      <Preview>Your BizzSurfer Go! conversation summary</Preview>
      <Body style={{ backgroundColor: '#fff7ed', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
          <Heading style={{ color: '#ea580c', fontSize: 24, marginBottom: 8 }}>
            BizzSurfer Go!
          </Heading>
          <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: 600, marginTop: 0 }}>
            Here's your conversation summary
          </Text>

          <Section style={{ background: '#ffffff', borderRadius: 12, padding: 16, marginTop: 16 }}>
            <Text style={{ margin: 0, color: '#475569', fontSize: 13 }}>Focus</Text>
            <Text style={{ margin: '4px 0 12px', color: '#0f172a', fontSize: 14 }}>{focus}</Text>
            <Text style={{ margin: 0, color: '#475569', fontSize: 13 }}>Model used</Text>
            <Text style={{ margin: '4px 0 12px', color: '#0f172a', fontSize: 14 }}>{modelUsed}</Text>
            <Hr style={{ borderColor: '#fed7aa', margin: '12px 0' }} />
            <Text style={{ margin: 0, color: '#475569', fontSize: 13 }}>Your question</Text>
            <Text style={{ margin: '4px 0 12px', color: '#0f172a', fontSize: 14, whiteSpace: 'pre-wrap' }}>
              {question}
            </Text>
            <Text style={{ margin: 0, color: '#475569', fontSize: 13 }}>BizzSurfer's take (excerpt)</Text>
            <Text style={{ margin: '4px 0 0', color: '#0f172a', fontSize: 14, whiteSpace: 'pre-wrap' }}>
              {excerpt}
            </Text>
          </Section>

          <Section style={{ marginTop: 24 }}>
            <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Upgrade to BizzSurfer Pro
            </Text>
            <Text style={{ color: '#334155', fontSize: 14, margin: 0 }}>
              • Unlimited questions across all models<br />
              • Full PDF reports per conversation<br />
              • Access to upcoming executive events<br />
              • A 1:1 demo call with our team
            </Text>
            <Button
              href={upgradeUrl}
              style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                padding: '12px 20px',
                borderRadius: 999,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: 16,
              }}
            >
              Upgrade & book a demo
            </Button>
          </Section>

          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 32, textAlign: 'center' }}>
            Sent from BizzSurfer Go! — your Agentic AI advisor.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BizzSurferSummaryEmail,
  subject: 'Your BizzSurfer Go! summary',
  displayName: 'BizzSurfer Chat Summary',
  previewData: {
    focus: 'Procurement in Manufacturing',
    modelUsed: 'OpenAI',
    question: 'How do I start with Agentic AI in procurement?',
    excerpt: 'Begin with high-volume, low-risk workflows where audit trails matter…',
    upgradeUrl: 'https://bizzsurfergo.lovable.app/pricing',
  },
} satisfies TemplateEntry
