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
  let sendingClaimed = false;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid send request." }, { status: 400 });
  }
  const draftId = payload && typeof payload === "object" && "draftId" in payload ? String((payload as { draftId: unknown }).draftId) : "";
  const accessToken = payload && typeof payload === "object" && "accessToken" in payload ? String((payload as { accessToken: unknown }).accessToken) : "";
  if (!/^[0-9a-f-]{36}$/i.test(draftId) || accessToken.length < 20 || accessToken.length > 5000) {
    return NextResponse.json({ error: "Invalid send request." }, { status: 400 });
  }

  try {
    const googleProfileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!googleProfileResponse.ok) return NextResponse.json({ error: "Gmail access expired or was not granted. Approve Gmail access and try again." }, { status: 401 });
    const googleProfile: unknown = await googleProfileResponse.json();
    const googleEmail = googleProfile && typeof googleProfile === "object" && "email" in googleProfile ? String((googleProfile as { email: unknown }).email) : "";
    if (googleEmail.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: `Gmail access was granted to a different account. Choose ${user.email} and try again.` }, { status: 403 });
    }

    const { data: draft, error: draftError } = await supabase
      .from("outreach_drafts")
      .select("id, recruiter_email, subject, body, status")
      .eq("id", draftId)
      .eq("user_id", user.id)
      .single();
    if (draftError || !draft) return NextResponse.json({ error: "This outreach draft could not be found." }, { status: 404 });
    if (draft.status !== "approved") return NextResponse.json({ error: "Approve the draft before sending it." }, { status: 409 });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.recruiter_email) || draft.subject.trim().length === 0 || draft.body.trim().length === 0) {
      return NextResponse.json({ error: "Add a valid recipient, subject, and message before sending." }, { status: 400 });
    }
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("resume_path, resume_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileError || !profile?.resume_path) return NextResponse.json({ error: "Upload a PDF resume in Profile before sending." }, { status: 400 });
    const { data: resume, error: resumeError } = await supabase.storage.from("resumes").download(profile.resume_path);
    if (resumeError || !resume) return NextResponse.json({ error: "Your saved resume could not be loaded. Upload it again from Profile." }, { status: 400 });
    if (resume.size > 5 * 1024 * 1024 || resume.type !== "application/pdf") {
      return NextResponse.json({ error: "The saved resume must be a PDF no larger than 5 MB." }, { status: 400 });
    }

    const { data: claimedDraft, error: claimError } = await supabase
      .from("outreach_drafts")
      .update({ status: "sending", updated_at: new Date().toISOString() })
      .eq("id", draft.id)
      .eq("user_id", user.id)
      .eq("status", "approved")
      .select("id")
      .maybeSingle();
    if (claimError || !claimedDraft) return NextResponse.json({ error: "This draft is already being sent or has already been sent." }, { status: 409 });
    sendingClaimed = true;

    const raw = makeMimeEmail({
      from: user.email,
      to: draft.recruiter_email,
      subject: draft.subject,
      body: draft.body,
      attachment: Buffer.from(await resume.arrayBuffer()),
      filename: profile.resume_name ?? "resume.pdf",
    });

    let gmailResponse: Response;
    try {
      gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
        cache: "no-store",
      });
    } catch {
      return NextResponse.json({ error: "The connection ended during sending. Check your Gmail Sent folder before retrying.", uncertain: true }, { status: 502 });
    }

    if (!gmailResponse.ok) {
      const { error: revertError } = await supabase.from("outreach_drafts")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", draft.id).eq("user_id", user.id).eq("status", "sending");
      if (revertError) console.error("Could not restore the approved draft status:", revertError.message);
      if (gmailResponse.status === 401) return NextResponse.json({ error: "Gmail authorization expired. Approve access again and retry." }, { status: 401 });
      if (gmailResponse.status === 403) return NextResponse.json({ error: "Google denied sending. Confirm Gmail API is enabled and the account has granted gmail.send access." }, { status: 403 });
      return NextResponse.json({ error: "Gmail could not send this message. The draft is still available to review and retry." }, { status: 502 });
    }

    const sent: unknown = await gmailResponse.json();
    const messageId = sent && typeof sent === "object" && "id" in sent ? String((sent as { id: unknown }).id) : "";
    if (!messageId) return NextResponse.json({ error: "Gmail accepted the request but returned no message ID. Check your Sent folder before retrying.", uncertain: true }, { status: 502 });

    const { error: markSentError } = await supabase.from("outreach_drafts").update({
      status: "sent",
      gmail_message_id: messageId,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", draft.id).eq("user_id", user.id).eq("status", "sending");
    if (markSentError) {
      console.error("Gmail sent but the Beaky draft status was not updated:", markSentError.message);
      return NextResponse.json({ error: "Gmail sent the message, but Beaky could not update its history. Check Email History before retrying.", uncertain: true }, { status: 502 });
    }

    return NextResponse.json({ ok: true, messageId });
  } catch (error) {
    console.error("Outreach send failed:", error);
    if (sendingClaimed) {
      return NextResponse.json({ error: "The send result is uncertain. Check Gmail Sent and Email History before retrying.", uncertain: true }, { status: 502 });
    }
    return NextResponse.json({ error: "Could not send this email. Try again after checking your Gmail connection." }, { status: 502 });
  }
}
