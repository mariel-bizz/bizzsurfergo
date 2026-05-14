import * as React from 'react'
import { render } from '@react-email/components'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'bizzsurfergo'
const SENDER_DOMAIN = 'notify.bizzsurfer.com'
const FROM_DOMAIN = 'notify.bizzsurfer.com'
const TEMPLATE_NAME = 'bizzsurfer-summary'
const UPGRADE_URL = 'https://bizzsurfergo.lovable.app/pricing'

const ALLOWED_ORIGIN_HOSTS = new Set([
  'bizzsurfergo.lovable.app',
  'go.bizzsurfer.ai',
  'www.bizzsurfer.ai',
  'bizzsurfer.ai',
])

const BodySchema = z.object({
  recipientEmail: z.string().email().max(254),
  focus: z.string().max(500).optional(),
  modelUsed: z.string().max(120).optional(),
  question: z.string().max(4000).optional(),
  excerpt: z.string().max(4000).optional(),
})

function redact(email: string) {
  const [l, d] = email.split('@')
  if (!l || !d) return '***'
  return `${l[0]}***@${d}`
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const Route = createFileRoute('/api/public/chat/email-summary')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Same-origin check: block cross-site abuse of this public endpoint.
        const originHeader = request.headers.get('origin') || request.headers.get('referer')
        if (originHeader) {
          try {
            const host = new URL(originHeader).hostname
            if (!ALLOWED_ORIGIN_HOSTS.has(host) && !host.endsWith('.lovable.app')) {
              return Response.json({ error: 'Forbidden' }, { status: 403 })
            }
          } catch {
            return Response.json({ error: 'Forbidden' }, { status: 403 })
          }
        } else {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        let parsed
        try {
          parsed = BodySchema.parse(await request.json())
        } catch (err) {
          return Response.json({ error: 'Invalid request body' }, { status: 400 })
        }

        const supabase = supabaseAdmin
        const recipient = parsed.recipientEmail
        const normalizedEmail = recipient.toLowerCase()
        const messageId = crypto.randomUUID()

        // Suppression check
        const { data: suppressed, error: suppErr } = await supabase
          .from('suppressed_emails')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle()
        if (suppErr) {
          console.error('Suppression check failed', suppErr)
          return Response.json({ error: 'Failed to verify suppression' }, { status: 500 })
        }
        if (suppressed) {
          return Response.json({ success: false, reason: 'email_suppressed' })
        }

        // Get/create unsubscribe token
        let unsubscribeToken: string
        const { data: existingToken } = await supabase
          .from('email_unsubscribe_tokens')
          .select('token, used_at')
          .eq('email', normalizedEmail)
          .maybeSingle()
        if (existingToken && !existingToken.used_at) {
          unsubscribeToken = existingToken.token
        } else if (!existingToken) {
          unsubscribeToken = generateToken()
          await supabase
            .from('email_unsubscribe_tokens')
            .upsert(
              { token: unsubscribeToken, email: normalizedEmail },
              { onConflict: 'email', ignoreDuplicates: true },
            )
          const { data: stored } = await supabase
            .from('email_unsubscribe_tokens')
            .select('token')
            .eq('email', normalizedEmail)
            .maybeSingle()
          if (stored?.token) unsubscribeToken = stored.token
        } else {
          return Response.json({ success: false, reason: 'email_suppressed' })
        }

        const template = TEMPLATES[TEMPLATE_NAME]
        if (!template) {
          return Response.json({ error: 'Template not found' }, { status: 500 })
        }

        const data = {
          focus: parsed.focus ?? 'Your transformation focus',
          modelUsed: parsed.modelUsed ?? 'BizzSurfer Go!',
          question: parsed.question ?? '',
          excerpt: parsed.excerpt ?? '',
          upgradeUrl: UPGRADE_URL,
        }
        const element = React.createElement(template.component, data)
        const html = await render(element)
        const text = await render(element, { plainText: true })
        const subject =
          typeof template.subject === 'function' ? template.subject(data) : template.subject

        await supabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: TEMPLATE_NAME,
          recipient_email: recipient,
          status: 'pending',
        })

        const { error: enqueueError } = await supabase.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: recipient,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text,
            purpose: 'transactional',
            label: TEMPLATE_NAME,
            idempotency_key: messageId,
            unsubscribe_token: unsubscribeToken,
            queued_at: new Date().toISOString(),
          },
        })

        if (enqueueError) {
          console.error('Failed to enqueue email', enqueueError)
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: TEMPLATE_NAME,
            recipient_email: recipient,
            status: 'failed',
            error_message: 'Failed to enqueue email',
          })
          return Response.json({ error: 'Failed to enqueue email' }, { status: 500 })
        }

        console.log('Chat summary email enqueued', { recipient: redact(recipient) })
        return Response.json({ success: true, queued: true })
      },
    },
  },
})
