import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import * as React from 'react'
import { render } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'bizzsurfergo'
const SENDER_DOMAIN = 'notify.bizzsurfer.com'
const FROM_DOMAIN = 'notify.bizzsurfer.com'

const ListingApplicationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(200).optional().nullable(),
  offeringType: z.enum(['Agent', 'Service', 'Playbook', 'Template', 'Other']),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(10).max(5000),
  website: z.string().trim().max(500).optional().nullable(),
})

export const submitListingApplication = createServerFn({ method: 'POST' })
  .inputValidator((data) => ListingApplicationSchema.parse(data))
  .handler(async ({ data }) => {
    const tmpl = TEMPLATES['marketplace-listing-application']
    if (!tmpl) throw new Error('Template not found')
    const recipient = tmpl.to || 'info@bizzsurfer.com'
    const messageId = crypto.randomUUID()

    const element = React.createElement(tmpl.component, data)
    const html = await render(element)
    const text = await render(element, { plainText: true })
    const subject = typeof tmpl.subject === 'function' ? tmpl.subject(data) : tmpl.subject

    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'marketplace-listing-application',
      recipient_email: recipient,
      status: 'pending',
    })

    const { error } = await supabaseAdmin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        reply_to: data.email,
        purpose: 'transactional',
        label: 'marketplace-listing-application',
        idempotency_key: messageId,
        queued_at: new Date().toISOString(),
      },
    })

    if (error) {
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'marketplace-listing-application',
        recipient_email: recipient,
        status: 'failed',
        error_message: error.message,
      })
      throw new Error('Failed to submit application')
    }

    return { success: true as const }
  })
