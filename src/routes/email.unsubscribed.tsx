import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, MailX } from 'lucide-react'

export const Route = createFileRoute('/email/unsubscribed')({
  head: () => ({
    meta: [
      { title: 'Unsubscribe — Bizzsurfer' },
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'description', content: 'Manage your Bizzsurfer email subscription.' },
    ],
  }),
  component: UnsubscribePage,
})

type State =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'already' }
  | { kind: 'confirm' }
  | { kind: 'working' }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

function UnsubscribePage() {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (!t) {
      setState({ kind: 'invalid' })
      return
    }
    setToken(t)
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}))
        if (!r.ok) return setState({ kind: 'invalid' })
        if (body.valid === false && body.reason === 'already_unsubscribed') return setState({ kind: 'already' })
        if (body.valid === true) return setState({ kind: 'confirm' })
        setState({ kind: 'invalid' })
      })
      .catch(() => setState({ kind: 'error', message: 'Could not reach the unsubscribe service.' }))
  }, [])

  const confirm = async () => {
    if (!token) return
    setState({ kind: 'working' })
    try {
      const r = await fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const body = await r.json().catch(() => ({}))
      if (!r.ok) return setState({ kind: 'error', message: body.error ?? 'Failed to unsubscribe.' })
      if (body.success) return setState({ kind: 'done' })
      if (body.reason === 'already_unsubscribed') return setState({ kind: 'already' })
      setState({ kind: 'error', message: 'Unexpected response from server.' })
    } catch (e: any) {
      setState({ kind: 'error', message: e?.message ?? 'Network error' })
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
            {state.kind === 'done' || state.kind === 'already' ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            ) : (
              <MailX className="h-6 w-6 text-slate-700" />
            )}
          </div>
          <CardTitle className="text-xl">
            {state.kind === 'done' && 'You are unsubscribed'}
            {state.kind === 'already' && 'Already unsubscribed'}
            {state.kind === 'confirm' && 'Unsubscribe from Bizzsurfer emails'}
            {state.kind === 'loading' && 'Checking your link…'}
            {state.kind === 'working' && 'Unsubscribing…'}
            {state.kind === 'invalid' && 'Invalid or expired link'}
            {state.kind === 'error' && 'Something went wrong'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {state.kind === 'confirm' && (
            <>
              <p className="text-sm text-muted-foreground">
                You will stop receiving Bizzsurfer email nudges, including upgrade reminders, at this address.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={confirm}>Confirm unsubscribe</Button>
                <Button variant="outline" asChild>
                  <a href="https://go.bizzsurfer.ai">Cancel</a>
                </Button>
              </div>
            </>
          )}
          {state.kind === 'done' && (
            <p className="text-sm text-muted-foreground">
              You will no longer receive marketing or nudge emails from us. Transactional emails (receipts, password resets) may still be sent.
            </p>
          )}
          {state.kind === 'already' && (
            <p className="text-sm text-muted-foreground">This address is already unsubscribed. No further action needed.</p>
          )}
          {state.kind === 'invalid' && (
            <p className="text-sm text-muted-foreground">The unsubscribe link is invalid or has expired. Please use a recent email link.</p>
          )}
          {state.kind === 'error' && (
            <>
              <p className="text-sm text-red-700">{state.message}</p>
              <Button variant="outline" onClick={confirm}>Try again</Button>
            </>
          )}
          {(state.kind === 'loading' || state.kind === 'working') && (
            <p className="text-sm text-muted-foreground">One moment…</p>
          )}
          <div className="pt-4">
            <a href="https://go.bizzsurfer.ai" className="text-xs text-muted-foreground underline">Back to Bizzsurfer</a>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
