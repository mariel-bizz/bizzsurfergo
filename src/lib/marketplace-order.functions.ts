import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import * as React from 'react'
import { render } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'bizzsurfergo'
const SENDER_DOMAIN = 'notify.bizzsurfer.com'
const FROM_DOMAIN = 'notify.bizzsurfer.com'

const OrderItemSchema = z.object({
  title: z.string().trim().min(1).max(300),
  provider: z.string().trim().min(1).max(300),
  category: z.string().trim().min(1).max(60),
})

const OrderRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(60).optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
  items: z.array(OrderItemSchema).min(1).max(50),
  honeypot: z.string().max(0).optional().default(''),
  elapsedMs: z.number().int().min(0).max(86_400_000).optional().default(0),
})

async function enqueueTemplate(opts: {
  templateName: string
  recipient: string
  data: Record<string, any>
  replyTo?: string
}) {
  const tmpl = TEMPLATES[opts.templateName]
  if (!tmpl) throw new Error(`Template not found: ${opts.templateName}`)
  const recipient = tmpl.to || opts.recipient
  const messageId = crypto.randomUUID()

  const element = React.createElement(tmpl.component, opts.data)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject = typeof tmpl.subject === 'function' ? tmpl.subject(opts.data) : tmpl.subject

  await supabaseAdmin.from('email_send_log').insert({
    message_id: messageId,
    template_name: opts.templateName,
    recipient_email: recipient,
    status: 'pending',
  })

  const payload: Record<string, any> = {
    message_id: messageId,
    to: recipient,
    from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
    sender_domain: SENDER_DOMAIN,
    subject,
    html,
    text,
    purpose: 'transactional',
    label: opts.templateName,
    idempotency_key: messageId,
    queued_at: new Date().toISOString(),
  }
  if (opts.replyTo) payload.reply_to = opts.replyTo

  const { error } = await supabaseAdmin.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload,
  })

  if (error) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: recipient,
      status: 'failed',
      error_message: error.message,
    })
  }
}

export const submitMarketplaceOrder = createServerFn({ method: 'POST' })
  .inputValidator((data) => OrderRequestSchema.parse(data))
  .handler(async ({ data }) => {
    // Anti-spam
    if (data.honeypot && data.honeypot.length > 0) {
      return { success: true as const }
    }
    if (data.elapsedMs > 0 && data.elapsedMs < 2000) {
      return { success: true as const }
    }

    await Promise.allSettled([
      enqueueTemplate({
        templateName: 'marketplace-order-request',
        recipient: 'info@bizzsurfer.com',
        data: {
          name: data.name,
          email: data.email,
          company: data.company,
          phone: data.phone,
          message: data.message,
          items: data.items,
        },
        replyTo: data.email,
      }),
      enqueueTemplate({
        templateName: 'marketplace-order-confirmation',
        recipient: data.email,
        data: {
          name: data.name,
          items: data.items,
        },
      }),
    ])

    return { success: true as const }
  })
