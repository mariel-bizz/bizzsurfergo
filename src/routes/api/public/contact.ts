import * as React from 'react'
import { render } from '@react-email/components'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'bizzsurfergo'
const SENDER_DOMAIN = 'notify.bizzsurfer.com'
const FROM_DOMAIN = 'notify.bizzsurfer.com'
const TEMPLATE_NAME = 'contact-form-admin-notification'

const ALLOWED_ORIGIN_HOSTS = new Set([
  'bizzsurfergo.lovable.app',
  'go.bizzsurfer.ai',
  'www.bizzsurfer.ai',
  'bizzsurfer.ai',
])

const BodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(254),
  phone: z
    .string()
    .trim()
    .min(5)
    .max(30)
    .regex(/^\+[1-9]\d{1,3}[\s\-().\d]{4,}$/, 'Phone must include international prefix, e.g. +1 555 123 4567'),
  topic: z.string().trim().min(1).max(120),
  message: z.string().trim().min(10).max(4000),
  // Honeypot: must be empty. Bots usually auto-fill every field.
  website: z.string().max(0).optional().or(z.literal('')),
})

export const Route = createFileRoute('/api/public/contact')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Same-origin guard
        const originHeader = request.headers.get('origin') || request.headers.get('referer')
        if (!originHeader) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }
        try {
          const host = new URL(originHeader).hostname
          if (!ALLOWED_ORIGIN_HOSTS.has(host) && !host.endsWith('.lovable.app') && !host.endsWith('.lovableproject.com')) {
            return Response.json({ error: 'Forbidden' }, { status: 403 })
          }
        } catch {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        let parsed: z.infer<typeof BodySchema>
        try {
          parsed = BodySchema.parse(await request.json())
        } catch (err) {
          const issues = err instanceof z.ZodError ? err.issues.map((i) => i.message) : []
          return Response.json({ error: 'Invalid request', issues }, { status: 400 })
        }

        // Honeypot triggered — silently accept to avoid tipping off bots
        if (parsed.website && parsed.website.length > 0) {
          console.warn('Contact honeypot triggered')
          return Response.json({ success: true })
        }

        const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null
        const ipHint =
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          null

        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from('contact_submissions')
          .insert({
            name: parsed.name,
            role: parsed.role,
            company: parsed.company,
            email: parsed.email,
            phone: parsed.phone,
            topic: parsed.topic,
            message: parsed.message,
            user_agent: userAgent,
            ip_hint: ipHint,
          })
          .select('id, created_at')
          .single()

        if (insertErr) {
          console.error('Failed to insert contact submission', insertErr)
          return Response.json({ error: 'Failed to save message' }, { status: 500 })
        }

        // Build + enqueue admin notification email
        const template = TEMPLATES[TEMPLATE_NAME]
        if (!template) {
          console.error('Contact notification template missing')
          return Response.json({ success: true, queued: false })
        }

        const recipient = template.to!
        const messageId = crypto.randomUUID()
        const data = {
          name: parsed.name,
          role: parsed.role,
          company: parsed.company,
          email: parsed.email,
          phone: parsed.phone,
          topic: parsed.topic,
          message: parsed.message,
          submittedAt: inserted?.created_at ?? new Date().toISOString(),
        }
        const element = React.createElement(template.component, data)
        const html = await render(element)
        const text = await render(element, { plainText: true })
        const subject =
          typeof template.subject === 'function' ? template.subject(data) : template.subject

        await supabaseAdmin.from('email_send_log').insert({
          message_id: messageId,
          template_name: TEMPLATE_NAME,
          recipient_email: recipient,
          status: 'pending',
        })

        const { error: enqueueError } = await supabaseAdmin.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: recipient,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            reply_to: parsed.email,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text,
            purpose: 'transactional',
            label: TEMPLATE_NAME,
            idempotency_key: messageId,
            queued_at: new Date().toISOString(),
          },
        })

        if (enqueueError) {
          console.error('Failed to enqueue contact email', enqueueError)
          await supabaseAdmin.from('email_send_log').insert({
            message_id: messageId,
            template_name: TEMPLATE_NAME,
            recipient_email: recipient,
            status: 'failed',
            error_message: 'Failed to enqueue email',
          })
          // Submission was saved — still treat as success for the user.
          return Response.json({ success: true, queued: false })
        }

        return Response.json({ success: true, queued: true })
      },
    },
  },
})
