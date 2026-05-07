// ============================================
// EVEN · Lead notification Edge Function
// Deploy: supabase functions deploy lead-notify
// Required env vars:
//   - RESEND_API_KEY  (https://resend.com)
//   - NOTIFY_EMAIL    (e.g. ilan@even-imobiliare.ro)
// ============================================

// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

interface LeadPayload {
  kind?: string;
  nume?: string;
  email?: string;
  telefon?: string;
  subiect?: string;
  mesaj?: string;
  property_id?: string;
  source_url?: string;
  created_at?: string;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") ?? "ilan@even-imobiliare.ro";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "EVEN <noreply@even-imobiliare.ro>";

function escape(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]!));
}

function buildEmail(p: LeadPayload) {
  const subject = `[EVEN] ${p.kind === "contact" ? "Mesaj contact" : "Cerere vizionare"} · ${p.nume ?? ""}`;
  const lines = [
    p.kind ? `Tip: ${p.kind}` : null,
    p.subiect ? `Subiect: ${p.subiect}` : null,
    p.nume ? `Nume: ${p.nume}` : null,
    p.email ? `Email: ${p.email}` : null,
    p.telefon ? `Telefon: ${p.telefon}` : null,
    p.property_id ? `Proprietate: ${p.property_id}` : null,
    p.mesaj ? `\nMesaj:\n${p.mesaj}` : null,
    p.source_url ? `\nSursă: ${p.source_url}` : null,
    p.created_at ? `Trimis la: ${p.created_at}` : null,
  ].filter(Boolean);
  return {
    subject,
    text: lines.join("\n"),
    html: `<div style="font-family: system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: #1C2340;">
      ${lines.map((l) => `<div>${escape(l!).replace(/\n/g, "<br>")}</div>`).join("")}
    </div>`,
  };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const payload: LeadPayload = await req.json();
    const { subject, text, html } = buildEmail(payload);

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set; skipping email send.");
      return new Response(JSON.stringify({ ok: true, sent: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [NOTIFY_EMAIL],
        reply_to: payload.email || undefined,
        subject,
        text,
        html,
      }),
    });
    const body = await res.json();
    return new Response(JSON.stringify({ ok: res.ok, body }), {
      status: res.ok ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
