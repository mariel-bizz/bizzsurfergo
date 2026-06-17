import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { AdminGate } from '@/components/AdminGate'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  listEmailLog,
  listSuppressedEmails,
  removeSuppression,
  sendTestDeliveryEmail,
} from '@/lib/email-admin.functions'

export const Route = createFileRoute('/admin/emails')({
  head: () => ({
    meta: [
      { title: 'Email delivery log' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: () => (
    <AdminGate>
      <EmailsAdminPage />
    </AdminGate>
  ),
})

type Row = {
  id: string
  message_id: string | null
  template_name: string | null
  recipient_email: string | null
  status: string
  error_message: string | null
  created_at: string
}

type Stats = { total: number; sent: number; pending: number; failed: number; dlq: number; bounced: number; suppressed: number }

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  dlq: 'bg-red-100 text-red-800 border-red-200',
  bounced: 'bg-orange-100 text-orange-800 border-orange-200',
  suppressed: 'bg-slate-200 text-slate-700 border-slate-300',
  complained: 'bg-purple-100 text-purple-800 border-purple-200',
}

function EmailsAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [templates, setTemplates] = useState<string[]>([])
  const [suppressed, setSuppressed] = useState<{ id: string; email: string; reason: string | null; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>('all')
  const [template, setTemplate] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)

  const fetchLog = useServerFn(listEmailLog)
  const fetchSuppressed = useServerFn(listSuppressedEmails)
  const sendTest = useServerFn(sendTestDeliveryEmail)
  const unsuppress = useServerFn(removeSuppression)

  const load = async () => {
    setLoading(true)
    try {
      const [log, sup] = await Promise.all([
        fetchLog({
          data: {
            status: status === 'all' ? null : status,
            template: template === 'all' ? null : template,
            search: search || null,
          },
        }),
        fetchSuppressed(),
      ])
      setRows(log.rows)
      setStats(log.stats)
      setTemplates(log.templates)
      setSuppressed(sup.rows)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, template])

  const handleSendTest = async () => {
    setSending(true)
    try {
      const r = await sendTest({ data: { recipientEmail: testEmail || undefined } })
      toast.success(`Test email queued to ${r.recipient}`)
      setTimeout(load, 800)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const handleUnsuppress = async (email: string) => {
    try {
      await unsuppress({ data: { email } })
      toast.success(`Removed ${email} from suppression list`)
      load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed')
    }
  }

  const cards = useMemo(
    () => [
      { label: 'Total', value: stats?.total ?? 0, tone: 'text-slate-900' },
      { label: 'Sent', value: stats?.sent ?? 0, tone: 'text-emerald-700' },
      { label: 'Pending', value: stats?.pending ?? 0, tone: 'text-amber-700' },
      { label: 'Failed', value: (stats?.failed ?? 0) + (stats?.dlq ?? 0), tone: 'text-red-700' },
      { label: 'Bounced', value: stats?.bounced ?? 0, tone: 'text-orange-700' },
      { label: 'Suppressed', value: stats?.suppressed ?? 0, tone: 'text-slate-600' },
    ],
    [stats],
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Email delivery log</h1>
          <p className="text-sm text-muted-foreground">
            Queued, sent, bounced, and failed messages from <code>notify.go.bizzsurfer.ai</code>.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className={`text-2xl font-semibold mt-1 ${c.tone}`}>{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send test email</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Recipient (leave empty to send to your account email)"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={handleSendTest} disabled={sending}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Queuing…' : 'Send test'}
          </Button>
          <span className="text-xs text-muted-foreground">
            Uses the <code>test-delivery</code> template. DNS for <code>notify.go.bizzsurfer.ai</code> must be verified for actual delivery.
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="pending">Pending (queued)</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="dlq">DLQ</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="suppressed">Suppressed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All templates</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search recipient…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') load() }}
              className="max-w-xs"
            />
            <Button variant="outline" size="sm" onClick={load}>Apply</Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No messages yet.</TableCell></TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[r.status] ?? ''}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.template_name ?? '—'}</TableCell>
                    <TableCell className="text-sm">{r.recipient_email ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-red-700 max-w-[320px] truncate" title={r.error_message ?? ''}>{r.error_message ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suppression list ({suppressed.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppressed.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">No suppressed addresses.</TableCell></TableRow>
                )}
                {suppressed.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{s.email}</TableCell>
                    <TableCell><Badge variant="outline">{s.reason ?? 'unknown'}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleUnsuppress(s.email)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
