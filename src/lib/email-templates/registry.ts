import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as bizzsurferSummary } from './bizzsurfer-summary'
import { template as waitlistConfirmation } from './waitlist-confirmation'
import { template as waitlistAdminNotification } from './waitlist-admin-notification'
import { template as marketplaceListingApplication } from './marketplace-listing-application'

/**
 * Template registry — maps template names to their React Email components.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'bizzsurfer-summary': bizzsurferSummary,
  'waitlist-confirmation': waitlistConfirmation,
  'waitlist-admin-notification': waitlistAdminNotification,
  'marketplace-listing-application': marketplaceListingApplication,
}
