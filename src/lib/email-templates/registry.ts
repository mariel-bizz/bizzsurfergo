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
import { template as contactFormAdminNotification } from './contact-form-admin-notification'
import { template as marketplaceListingApplication } from './marketplace-listing-application'
import { template as marketplaceListingConfirmation } from './marketplace-listing-confirmation'
import { template as marketplaceOrderRequest } from './marketplace-order-request'
import { template as marketplaceOrderConfirmation } from './marketplace-order-confirmation'
import { template as adminAlert } from './admin-alert'
import { template as checkoutConfirmation } from './checkout-confirmation'
import { template as eventWaitlistOpen } from './event-waitlist-open'
import { template as quotaNotification } from './quota-notification'
import { template as testDelivery } from './test-delivery'

/**
 * Template registry — maps template names to their React Email components.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'bizzsurfer-summary': bizzsurferSummary,
  'waitlist-confirmation': waitlistConfirmation,
  'waitlist-admin-notification': waitlistAdminNotification,
  'contact-form-admin-notification': contactFormAdminNotification,
  'marketplace-listing-application': marketplaceListingApplication,
  'marketplace-listing-confirmation': marketplaceListingConfirmation,
  'marketplace-order-request': marketplaceOrderRequest,
  'marketplace-order-confirmation': marketplaceOrderConfirmation,
  'admin-alert': adminAlert,
  'checkout-confirmation': checkoutConfirmation,
  'event-waitlist-open': eventWaitlistOpen,
  'quota-notification': quotaNotification,
  'test-delivery': testDelivery,
}
