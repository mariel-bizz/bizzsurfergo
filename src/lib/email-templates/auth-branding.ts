/**
 * Centralized branding + subject lines for auth emails.
 *
 * Edit THIS file to change subjects, colors, fonts, or the logo across
 * all auth email templates (signup / magic link / recovery / invite /
 * email change / reauthentication). The template bodies stay untouched.
 *
 * After editing, re-publish to push changes to Live email rendering.
 */

export const AUTH_BRAND = {
  /** Display name used in subjects and copy. */
  siteName: 'Bizzsurfer',
  /** Marketing site shown next to the brand name. */
  siteUrl: 'https://go.bizzsurfer.ai',
  /** Logo rendered at the top of every auth email. Leave empty to hide. */
  logoUrl: 'https://go.bizzsurfer.ai/icons/icon-192.png',
  /** Pixel height of the logo. */
  logoHeight: 36,
  /** Primary brand color (used for headings and CTA buttons). */
  primaryColor: '#0b1220',
  /** CTA button text color. */
  primaryContrast: '#ffffff',
  /** Body text color. */
  textColor: '#334155',
  /** Footer / muted text. */
  mutedColor: '#94a3b8',
  /** Font stack. */
  fontFamily: 'Inter, Arial, sans-serif',
  /** Reply-to / support address shown in footer. */
  supportEmail: 'support@bizzsurfer.com',
} as const

/**
 * Subject lines per Supabase auth action_type. Edit freely.
 * `email_change` is the recipient-confirmation half of the email change flow.
 */
export const AUTH_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email for Bizzsurfer',
  invite: "You're invited to Bizzsurfer",
  magiclink: 'Your Bizzsurfer login link',
  recovery: 'Reset your Bizzsurfer password',
  email_change: 'Confirm your new Bizzsurfer email',
  reauthentication: 'Your Bizzsurfer verification code',
}
