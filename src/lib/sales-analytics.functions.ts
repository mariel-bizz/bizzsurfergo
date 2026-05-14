import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

const RangeSchema = z.object({ days: z.number().int().min(1).max(365).default(30) })

export const getSalesAnalytics = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RangeSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Admin only
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    })
    if (!isAdmin) throw new Error('Forbidden')

    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString()

    const [waitlistRes, ordersRes, subsRes, clicksRes] = await Promise.all([
      supabaseAdmin
        .from('waitlist')
        .select('id, email, name, role, company, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('orders')
        .select('id, customer_email, amount_total, currency, status, environment, listing_title, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('subscriptions')
        .select('id, user_id, status, environment, created_at')
        .gte('created_at', since),
      supabaseAdmin
        .from('outbound_clicks')
        .select('source, destination, referrer, created_at')
        .gte('created_at', since),
    ])

    const waitlist = waitlistRes.data || []
    const orders = (ordersRes.data || []).filter((o) => o.status === 'completed' || o.status === 'paid')
    const subs = subsRes.data || []
    const clicks = clicksRes.data || []

    const waitlistEmails = new Set(waitlist.map((w) => w.email.toLowerCase()))
    const purchaserEmails = new Set(
      orders.map((o) => (o.customer_email || '').toLowerCase()).filter(Boolean),
    )
    const converted = [...waitlistEmails].filter((e) => purchaserEmails.has(e))

    const revenue = orders.reduce((sum, o) => sum + (o.amount_total || 0), 0)
    const liveRevenue = orders
      .filter((o) => o.environment === 'live')
      .reduce((sum, o) => sum + (o.amount_total || 0), 0)

    // Daily series
    const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10)
    const series = new Map<string, { date: string; signups: number; orders: number; revenue: number }>()
    for (let i = data.days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      series.set(d, { date: d, signups: 0, orders: 0, revenue: 0 })
    }
    for (const w of waitlist) {
      const k = dayKey(w.created_at)
      const row = series.get(k)
      if (row) row.signups++
    }
    for (const o of orders) {
      const k = dayKey(o.created_at)
      const row = series.get(k)
      if (row) {
        row.orders++
        row.revenue += (o.amount_total || 0) / 100
      }
    }

    // Lead sources from outbound clicks (proxy for traffic origins)
    const sourceCounts = new Map<string, number>()
    for (const c of clicks) {
      const key = c.source || 'unknown'
      sourceCounts.set(key, (sourceCounts.get(key) || 0) + 1)
    }
    const leadSources = [...sourceCounts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Role breakdown
    const roleCounts = new Map<string, number>()
    for (const w of waitlist) {
      const key = (w.role || 'unspecified').toLowerCase()
      roleCounts.set(key, (roleCounts.get(key) || 0) + 1)
    }
    const roleBreakdown = [...roleCounts.entries()]
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      stats: {
        waitlistSignups: waitlist.length,
        orders: orders.length,
        subscriptions: subs.length,
        revenueCents: revenue,
        liveRevenueCents: liveRevenue,
        convertedCount: converted.length,
        conversionRate: waitlist.length > 0 ? converted.length / waitlist.length : 0,
      },
      series: [...series.values()],
      leadSources,
      roleBreakdown,
      recentSignups: waitlist.slice(0, 25),
      recentOrders: orders.slice(0, 25).map((o) => ({
        id: o.id,
        email: o.customer_email,
        amount: (o.amount_total || 0) / 100,
        currency: o.currency,
        listing: o.listing_title,
        environment: o.environment,
        created_at: o.created_at,
      })),
    }
  })
