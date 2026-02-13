"use server";

import { Resend } from "resend";

import db from "@/lib/supabase/db";
import type { FeedbackType } from "@/types/feedback";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? process.env.BOOK_MARKD_RESEND_API_KEY;
const FROM_EMAIL = "BookMarkd <onboarding@resend.dev>";

const getAdminEmails = async (): Promise<string[]> => {
  const { data, error } = await db.client
    .from("users")
    .select("email")
    .eq("is_admin", true);

  if (error) {
    console.error("[feedback-notification] Error fetching admin emails:", error);
    return [];
  }

  const emails = (data ?? [])
    .map((row: { email: string }) => row.email)
    .filter((email): email is string => Boolean(email));

  return emails;
};

export type FeedbackNotificationPayload = {
  type: FeedbackType;
  title: string;
  description: string;
  submitterDisplayName: string;
  submitterUsername: string | null;
  url: string | null;
};

const sendFeedbackNotificationToAdmins = async (
  payload: FeedbackNotificationPayload,
): Promise<void> => {
  if (!RESEND_API_KEY) {
    console.warn("[feedback-notification] RESEND_API_KEY not set, skipping email.");
    return;
  }

  const adminEmails = await getAdminEmails();
  if (adminEmails.length === 0) {
    console.warn("[feedback-notification] No admin emails found, skipping.");
    return;
  }

  const typeLabel = payload.type === "bug" ? "Bug signalé" : "Nouvelle suggestion";
  const submitterInfo = payload.submitterUsername
    ? `${payload.submitterDisplayName} (@${payload.submitterUsername})`
    : payload.submitterDisplayName;

  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const safeTitle = escapeHtml(payload.title);
  const safeDescription = escapeHtml(payload.description);
  const safeSubmitterInfo = escapeHtml(submitterInfo);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">${typeLabel} – BookMarkd</h2>
  <p><strong>De :</strong> ${safeSubmitterInfo}</p>
  <p><strong>Titre :</strong> ${safeTitle}</p>
  <p><strong>Description :</strong></p>
  <pre style="background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap;">${safeDescription}</pre>
  ${payload.url && payload.url.startsWith("http") ? `<p><strong>URL :</strong> <a href="${escapeHtml(payload.url)}">${escapeHtml(payload.url)}</a></p>` : payload.url ? `<p><strong>URL :</strong> ${escapeHtml(payload.url)}</p>` : ""}
  <p style="color: #666; font-size: 12px; margin-top: 24px;">Consultez les suggestions sur votre profil.</p>
</body>
</html>
  `.trim();

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmails,
      subject: `[BookMarkd] ${typeLabel} : ${payload.title}`,
      html,
    });

    if (error) {
      console.error("[feedback-notification] Resend error:", error);
    }
  } catch (err) {
    console.error("[feedback-notification] Failed to send email:", err);
  }
};

export { getAdminEmails, sendFeedbackNotificationToAdmins };
