import { NextResponse } from "next/server";
import { carePlans } from "@/content/pricing";
import { levels, quote, serviceLines, summarize, type Selection } from "@/lib/quote";

/**
 * Inquiry endpoint for the quote builder.
 *
 * Emails the inquiry (Resend) and stores it (Supabase). Both are configured
 * only through environment variables — nothing is committed:
 *
 *   RESEND_API_KEY              Resend API key
 *   INQUIRY_TO                  inbox that receives inquiries
 *   INQUIRY_FROM                verified sender, e.g. "Black Saint <hello@your-domain>"
 *   SUPABASE_URL                project URL            (optional: storage)
 *   SUPABASE_SERVICE_ROLE_KEY   service role key       (optional: storage)
 *
 * Storage expects a table `inquiries` with columns: name, email, company,
 * message, selection (jsonb), summary (text), created_at (default now()).
 *
 * With nothing configured it answers 503 and the form says so plainly.
 */

export const runtime = "nodejs";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function parseSelection(raw: unknown): Selection | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const service = serviceLines.find((x) => x.id === s.service)?.id;
  const level = levels.find((x) => x.id === s.level)?.id;
  const care = s.care === "none" ? "none" : carePlans.find((c) => c.id === s.care)?.id;
  const pages = Number(s.pages);
  if (!service || !level || !care || !Number.isFinite(pages)) return null;
  return {
    service,
    level,
    care,
    pages: Math.min(12, Math.max(1, Math.round(pages))),
    rush: s.rush === true,
    currency: s.currency === "USD" ? "USD" : "PHP",
  };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // Honeypot: real people never fill this field.
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const company = clean(body.company, 160);
  const message = clean(body.message, 4000);
  const selection = parseSelection(body.selection);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !selection)
    return NextResponse.json({ error: "invalid" }, { status: 400 });

  // Recomputed on the server: the client's numbers are never trusted.
  const summary = summarize(selection, quote(selection));

  const { RESEND_API_KEY, INQUIRY_TO, INQUIRY_FROM, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } =
    process.env;
  const canEmail = Boolean(RESEND_API_KEY && INQUIRY_TO && INQUIRY_FROM);
  const canStore = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
  if (!canEmail && !canStore)
    return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const jobs: Promise<boolean>[] = [];

  if (canEmail)
    jobs.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: INQUIRY_FROM,
          to: [INQUIRY_TO],
          reply_to: email,
          subject: `New inquiry — ${name}${company ? `, ${company}` : ""}`,
          text: `${name} <${email}>${company ? `\n${company}` : ""}\n\n${summary}\n\n${message || "(no message)"}`,
        }),
      })
        .then((r) => r.ok)
        .catch(() => false),
    );

  if (canStore)
    jobs.push(
      fetch(`${SUPABASE_URL}/rest/v1/inquiries`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ name, email, company, message, selection, summary }),
      })
        .then((r) => r.ok)
        .catch(() => false),
    );

  const results = await Promise.all(jobs);
  // The inquiry counts as received if it landed anywhere.
  if (!results.some(Boolean)) return NextResponse.json({ error: "failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
