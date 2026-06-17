import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MailCheck, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/auth/resend')({
  head: () => ({
    meta: [
      { title: 'Resend auth email — Bizzsurfer' },
      { name: 'robots', content: 'noindex, nofollow' },
      {
        name: 'description',
        content: 'Resend your Bizzsurfer signup verification, password reset, or email change confirmation.',
      },
    ],
  }),
  component: ResendAuthPage,
})

const REDIRECT_TO = 'https://go.bizzsurfer.ai/auth/callback'

function ResendAuthPage() {
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedInEmail(data.user?.email ?? null))
  }, [])

  return (
    <main className="min-h-screen bg-white px-4 py-12 flex items-start justify-center">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-1">
          <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to sign in
          </Link>
          <h1 className="text-2xl font-semibold">Didn't get an email?</h1>
          <p className="text-sm text-muted-foreground">
            Resend your verification, password reset, or email-change link. Check spam first — emails come from
            <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">notify.go.bizzsurfer.ai</code>.
          </p>
        </div>

        <Tabs defaultValue="verify">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="verify">Verify email</TabsTrigger>
            <TabsTrigger value="reset">Reset password</TabsTrigger>
            <TabsTrigger value="change">Change email</TabsTrigger>
          </TabsList>

          <TabsContent value="verify">
            <ResendVerificationCard />
          </TabsContent>
          <TabsContent value="reset">
            <ResendPasswordResetCard />
          </TabsContent>
          <TabsContent value="change">
            <ChangeEmailCard signedInEmail={signedInEmail} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function ResendVerificationCard() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: REDIRECT_TO } })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
    toast.success('Verification email queued')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resend verification email</CardTitle>
        <CardDescription>
          We'll send a fresh confirmation link to the email you used at signup. Valid for a limited time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <Alert>
            <MailCheck className="h-4 w-4" />
            <AlertDescription>
              If an account exists for <strong>{email}</strong>, a verification email is on its way. Check your inbox and spam folder.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="verify-email">Email address</Label>
              <Input id="verify-email" type="email" required autoComplete="email" value={email}
                     onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Resend verification email
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function ResendPasswordResetCard() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://go.bizzsurfer.ai/reset-password' })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
    toast.success('Password reset email queued')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resend password reset</CardTitle>
        <CardDescription>We'll send a new link to reset your password.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <Alert>
            <MailCheck className="h-4 w-4" />
            <AlertDescription>
              If an account exists for <strong>{email}</strong>, a password reset email is on its way.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="reset-email">Email address</Label>
              <Input id="reset-email" type="email" required autoComplete="email" value={email}
                     onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send password reset
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function ChangeEmailCard({ signedInEmail }: { signedInEmail: string | null }) {
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  if (!signedInEmail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change email address</CardTitle>
          <CardDescription>
            You need to be signed in with your current email to request a change.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/login">Sign in to continue</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail) return
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail }, { emailRedirectTo: REDIRECT_TO })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
    toast.success('Confirmation emails sent to both addresses')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change email address</CardTitle>
        <CardDescription>
          Currently signed in as <strong>{signedInEmail}</strong>. We'll send a confirmation link to your new address —
          and a security notice to your current one — before the change takes effect.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <Alert>
            <MailCheck className="h-4 w-4" />
            <AlertDescription>
              Confirmation emails sent. Open the link in the email at <strong>{newEmail}</strong> to finish the change.
              If you didn't get it within a few minutes, try again or use a different address.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="new-email">New email address</Label>
              <Input id="new-email" type="email" required autoComplete="email" value={newEmail}
                     onChange={(e) => setNewEmail(e.target.value)} placeholder="new@example.com" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send confirmation to new address
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
