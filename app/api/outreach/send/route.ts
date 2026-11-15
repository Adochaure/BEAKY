import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function base64Lines(value: Buffer) {
  return value.toString("base64").match(/.{1,76}/g)?.join("\r\n") ?? "";
}

function safeHeader(value: string) {
  return value.replace(/[\r\n\0]/g, " ").trim();
}

function makeMimeEmail({
  from,
  to,
  subject,
  body,
  attachment,
  filename,
}: {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachment: Buffer;
  filename: string;
}) {
  const boundary = `beaky_${randomUUID().replaceAll("-", "")}`;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(safeHeader(subject), "utf8").toString("base64")}?=`;
  const encodedFilename = safeHeader(filename).replace(/["\\]/g, "_").slice(0, 120) || "resume.pdf";
  const mime = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(Buffer.from(body, "utf8")),
    `--${boundary}`,
    `Content-Type: application/pdf; name="${encodedFilename}"`,
    `Content-Disposition: attachment; filename="${encodedFilename}"`,
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(attachment),
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return Buffer.from(mime, "utf8").toString("base64url");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.email) return NextResponse.json({ error: "Sign in again to send outreach." }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid send request." }, { status: 400 });
  }

  const record = payload as Record<string, unknown>;
  const draftId = typeof record.draftId === "string" ? record.draftId : "";
  const accessToken = typeof record.accessToken === "string" ? record.accessToken : "";
  const dispatchMode = typeof record.dispatchMode === "string" ? record.dispatchMode : "gmail_api";

  if (!/^[0-9a-f-]{36}$/i.test(draftId)) {
    return NextResponse.json({ error: "Invalid draft ID." }, { status: 400 });
  }

  const { data: draft, error: draftError } = await supabase
    .from("outreach_drafts")
    .select("id, recruiter_email, recruiter_name, company, subject, body, status")
    .eq("id", draftId)
    .eq("user_id", user.id)
    .single();

  if (draftError || !draft) {
    return NextResponse.json({ error: "This outreach draft could not be found." }, { status: 404 });
  }

  // Handle client launch / web dispatch recording
  if (dispatchMode === "gmail_web" || dispatchMode === "record_sent") {
    const now = new Date().toISOString();
    await supabase.from("outreach_drafts").update({
      status: "sent",
      sent_at: now,
      updated_at: now,
      approved_at: now,
    }).eq("id", draft.id).eq("user_id", user.id);

    // Save contact to recruiter_contacts if domain is present
    const domain = draft.recruiter_email.split("@")[1] || "";
    if (domain) {
      try {
        await supabase.from("recruiter_contacts").insert({
          user_id: user.id,
          name: draft.recruiter_name || "",
          company: draft.company,
          email: draft.recruiter_email,
          domain,
          domain_status: "mx_found",
          check_message: "Contact contacted via Beaky outreach.",
        });
      } catch {
        // Non-fatal contact save error
      }
    }

    // Write audit log
    try {
      await supabase.from("discovery_logs").insert({
        user_id: user.id,
        step: "email_sent",
        result: {
          to: draft.recruiter_email,
          company: draft.company,
          subject: draft.subject,
          method: dispatchMode === "gmail_web" ? "gmail_web_composer" : "direct_dispatch",
        },
      });
    } catch {
      // Non-fatal log error
    }

    return NextResponse.json({ ok: true, method: dispatchMode });
  }

  // Gmail API REST dispatch
  if (accessToken.length < 20) {
    return NextResponse.json({ error: "Gmail access token is missing. Grant Gmail access or use 'Open in Gmail Web'." }, { status: 400 });
  }

  try {
    const googleProfileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!googleProfileResponse.ok) {
      return NextResponse.json({ error: "Gmail authorization expired or was denied. Try again or use 'Open in Gmail Web'." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("resume_path, resume_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.resume_path) {
      return NextResponse.json({ error: "Upload a PDF resume in Profile before sending." }, { status: 400 });
    }

    const { data: resume, error: resumeError } = await supabase.storage.from("resumes").download(profile.resume_path);
    if (resumeError || !resume) {
      return NextResponse.json({ error: "Your resume could not be retrieved from storage. Upload it again in Profile." }, { status: 400 });
    }

    const raw = makeMimeEmail({
      from: user.email,
      to: draft.recruiter_email,
      subject: draft.subject,
      body: draft.body,
      attachment: Buffer.from(await resume.arrayBuffer()),
      filename: profile.resume_name ?? "resume.pdf",
    });

    const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
      cache: "no-store",
    });

    if (!gmailResponse.ok) {
      const errText = await gmailResponse.text().catch(() => "");
      console.error("Gmail API send error:", gmailResponse.status, errText);
      return NextResponse.json({
        error: "Gmail could not send this message directly (Google API error). You can use 'Open in Gmail Web' to send it with 1 click.",
        fallbackAvailable: true,
      }, { status: 502 });
    }

    const sent = await gmailResponse.json();
    const messageId = sent && typeof sent === "object" && "id" in sent ? String(sent.id) : "sent";

    const now = new Date().toISOString();
    await supabase.from("outreach_drafts").update({
      status: "sent",
      gmail_message_id: messageId,
      sent_at: now,
      updated_at: now,
    }).eq("id", draft.id).eq("user_id", user.id);

    // Save contact & log
    const domain = draft.recruiter_email.split("@")[1] || "";
    if (domain) {
      try {
        await supabase.from("recruiter_contacts").insert({
          user_id: user.id,
          name: draft.recruiter_name || "",
          company: draft.company,
          email: draft.recruiter_email,
          domain,
          domain_status: "mx_found",
          check_message: "Contact contacted via Gmail API.",
        });
      } catch {
        // Non-fatal contact save error
      }
    }

    try {
      await supabase.from("discovery_logs").insert({
        user_id: user.id,
        step: "email_sent",
        result: {
          to: draft.recruiter_email,
          company: draft.company,
          subject: draft.subject,
          messageId,
          method: "gmail_api",
        },
      });
    } catch {
      // Non-fatal log error
    }

    return NextResponse.json({ ok: true, messageId });
  } catch (error) {
    console.error("Outreach send failed:", error);
    return NextResponse.json({
      error: "Could not complete send via Gmail API. You can launch Gmail Web directly to send.",
      fallbackAvailable: true,
    }, { status: 502 });
  }
}
