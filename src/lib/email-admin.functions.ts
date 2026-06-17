import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

type LogRow = {
  id: string
  message_id: string | null
  template_name: string | null
  recipient_email: string | null
  status: string
  error_message: string | null
  created_at: string
}

type ListInput = {
  status?: string | null
  template?: string | null
  search?: string | null
  limit?: number
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await ctx.supabase.rpc('has_role', {
    _user_id: ctx.userId,
    _role: 'admin',
  })
  if (error || !isAdmin) throw new Error('Forbidden')
}

export const listEmailLog = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ListInput) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const limit = Math.min(Math.max(data.limit ?? 200, 1), 500)

    let q = supabaseAdmin
      .from('email_send_log')
      .select('id, message_id, template_name, recipient_email, status, error_message, created_at')
      .order('created_at', { ascending: false })
      .limit(limit * 3) // overfetch to allow dedup

    if (data.status) q = q.eq('status', data.status)
    if (data.template) q = q.eq('template_name', data.template)
    if (data.search) q = q.ilike('recipient_email', `%${data.search}%`)

    const { data: rows, error } = await q
    if (error) throw new Error(error.message)

    // Deduplicate by message_id (latest row wins; rows are already DESC)
    const seen = new Set<string>()
    const deduped: LogRow[] = []
    for (const r of (rows ?? []) as LogRow[]) {
      const key = r.message_id ?? r.id
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push(r)
      if (deduped.length >= limit) break
    }

    // Summary stats over the deduped window
    const stats = { total: deduped.length, sent: 0, pending: 0, failed: 0, dlq: 0, bounced: 0, suppressed: 0 }
    for (const r of deduped) {
      if (r.status in stats) (stats as any)[r.status] += 1
    }

    // Distinct template names for the filter dropdown
    const { data: tmpls } = await supabaseAdmin
      .from('email_send_log')
      .select('template_name')
      .not('template_name', 'is', null)
      .order('template_name')
    const templates = Array.from(new Set((tmpls ?? []).map((t: any) => t.template_name).filter(Boolean)))

    return { rows: deduped, stats, templates }
  })

export const listSuppressedEmails = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data, error } = await supabaseAdmin
      .from('suppressed_emails')
      .select('id, email, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return { rows: data ?? [] }
  })

export const removeSuppression = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin
      .from('suppressed_emails')
      .delete()
      .eq('email', data.email.toLowerCase())
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const sendTestDeliveryEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { recipientEmail?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any)
    const ctx = context as any
    const callerEmail = ctx.claims?.email as string | undefined
    const recipient = (data.recipientEmail || callerEmail || '').trim()
    if (!recipient) throw new Error('No recipient and caller has no email on file')

    const { enqueueTemplateEmail } = await import('@/lib/email/enqueue.server')
    const result = await enqueueTemplateEmail({
      templateName: 'test-delivery',
      recipient,
      data: { recipientEmail: recipient, sentAt: new Date().toISOString() },
      idempotencyKey: `test-delivery-${Date.now()}`,
    })
    if (!result.ok) throw new Error(result.error || 'Failed to enqueue test email')
    return { ok: true, recipient, messageId: result.messageId }
  })
