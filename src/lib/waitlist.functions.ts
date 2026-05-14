import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import * as React from 'react'
import { render } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'bizzsurfergo'
const SENDER_DOMAIN = 'notify.bizzsurfer.com'
const FROM_DOMAIN = 'notify.bizzsurfer.com'

const WaitlistSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  role: z.string().trim().max(200).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  source: z.string().trim().max(100).optional().nullable(),
})

async function enqueueTemplate(opts: {
  templateName: string
  recipient: string
  data: Record<string, any>
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
      purpose: 'transactional',
      label: opts.templateName,
      idempotency_key: messageId,
      queued_at: new Date().toISOString(),
    },
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

async function pushToHubSpot(data: {
  name: string
  email: string
  role?: string | null
  company?: string | null
  source?: string | null
}) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY
  const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY
  if (!LOVABLE_API_KEY || !HUBSPOT_API_KEY) {
    console.warn('HubSpot not configured — skipping CRM sync')
    return
  }

  const [firstname, ...rest] = (data.name || '').split(' ')
  const lastname = rest.join(' ') || ''

  try {
    const res = await fetch('https://connector-gateway.lovable.dev/hubspot/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': HUBSPOT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          email: data.email,
          firstname,
          lastname,
          jobtitle: data.role || '',
          company: data.company || '',
          hs_lead_status: 'NEW',
          lifecyclestage: 'lead',
          lead_source: data.source || 'bizzsurfer_waitlist',
        },
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      // 409 = contact already exists; treat as success
      if (res.status !== 409) {
        console.error('HubSpot contact create failed', res.status, body)
      }
    }
  } catch (err) {
    console.error('HubSpot sync error', err)
  }
}

export const submitWaitlist = createServerFn({ method: 'POST' })
  .inputValidator((data) => WaitlistSchema.parse(data))
  .handler(async ({ data }) => {
    const { name, email, role, company, source } = data

    // Insert waitlist row (idempotent: email is unique)
    const { error: insertError } = await supabaseAdmin.from('waitlist').insert({
      name,
      email,
      role: role || null,
      company: company || null,
    })

    if (insertError) {
      // Duplicate email — return a friendly status but still skip emails/HubSpot
      if ((insertError as any).code === '23505') {
        return { success: false, reason: 'already_joined' as const }
      }
      console.error('Waitlist insert failed', insertError)
      throw new Error('Failed to join waitlist')
    }

    // Fire-and-forget side effects — never block the user response on these.
    await Promise.allSettled([
      enqueueTemplate({
        templateName: 'waitlist-confirmation',
        recipient: email,
        data: { name },
      }),
      enqueueTemplate({
        templateName: 'waitlist-admin-notification',
        recipient: 'marketing@bizzsurfer.com',
        data: { name, email, role, company, source },
      }),
      pushToHubSpot({ name, email, role, company, source }),
    ])

    return { success: true as const }
  })
