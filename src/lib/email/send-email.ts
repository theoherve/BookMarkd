import { Resend } from "resend";
import db from "@/lib/supabase/db";

const RESEND_API_KEY =
  process.env.RESEND_API_KEY ?? process.env.BOOK_MARKD_RESEND_API_KEY;

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  emailType: string;
  metadata?: Record<string, unknown>;
};

export const sendEmail = async (params: SendEmailParams): Promise<void> => {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping.");
    return;
  }

  const resend = new Resend(RESEND_API_KEY);
  const recipients = Array.isArray(params.to) ? params.to : [params.to];

  try {
    const { data, error } = await resend.emails.send({
      from: "BookMarkd <onboarding@resend.dev>",
      to: recipients,
      subject: params.subject,
      html: params.html,
    });

    for (const recipient of recipients) {
      await db.client
        .from("email_logs")
        .insert({
          email_type: params.emailType,
          recipient_email: recipient,
          subject: params.subject,
          status: error ? "failed" : "sent",
          resend_id: data?.id ?? null,
          error_message: error?.message ?? null,
          metadata: params.metadata ?? {},
        })
        .then(
          () => {},
          (logErr: unknown) => {
            console.error("[email] Failed to log email:", logErr);
          },
        );
    }

    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (err) {
    for (const recipient of recipients) {
      try {
        await db.client.from("email_logs").insert({
          email_type: params.emailType,
          recipient_email: recipient,
          subject: params.subject,
          status: "failed",
          error_message: (err as Error).message,
          metadata: params.metadata ?? {},
        });
      } catch {
        // Silently ignore logging failures
      }
    }
    console.error("[email] Failed to send:", err);
  }
};
