import * as React from "react";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "bizzsurfergo";
const SENDER_DOMAIN = "notify.bizzsurfer.com";
const FROM_DOMAIN = "notify.bizzsurfer.com";

/**
 * Pre-render a registered template and push it onto the transactional email
 * queue. No-ops silently if email infrastructure is not configured.
 */
export async function enqueueTemplateEmail(opts: {
  templateName: string;
  recipient: string;
  data: Record<string, unknown>;
  idempotencyKey?: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const tmpl = TEMPLATES[opts.templateName];
  if (!tmpl) return { ok: false, error: `template_not_found:${opts.templateName}` };
  const recipient = tmpl.to || opts.recipient;
  if (!recipient) return { ok: false, error: "no_recipient" };

  const messageId = opts.idempotencyKey || crypto.randomUUID();
  let subject: string;
  let html: string;
  let text: string;
  try {
    const element = React.createElement(tmpl.component, opts.data);
    html = await render(element);
    text = await render(element, { plainText: true });
    subject = typeof tmpl.subject === "function" ? tmpl.subject(opts.data) : tmpl.subject;
  } catch (e) {
    return { ok: false, error: `render_failed:${(e as Error).message}` };
  }

  try {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: recipient,
      status: "pending",
    });

    const { error } = await supabaseAdmin.rpc("enqueue_email" as never, {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: "transactional",
        label: opts.templateName,
        idempotency_key: messageId,
        queued_at: new Date().toISOString(),
      },
    } as never);

    if (error) {
      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: opts.templateName,
        recipient_email: recipient,
        status: "failed",
        error_message: error.message,
      });
      return { ok: false, error: error.message };
    }
    return { ok: true, messageId };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
