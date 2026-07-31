// Supabase Edge Function: verify-razorpay-payment
// Deploy: supabase functions deploy verify-razorpay-payment
//
// Verifies the HMAC-SHA256 signature Razorpay returns after checkout, and
// only then marks the booking as `confirmed` and the payment as `captured`.
// This is the ONLY place a booking should transition to `confirmed` — never
// trust a client-side "payment succeeded" callback alone.
//
// After confirmation it automatically triggers:
//   1. Guest booking confirmation SMS (via send-sms-hook)
//   2. Admin notification SMS (via send-sms-hook)

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacSha256Hex(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Format a date string (YYYY-MM-DD) to human-readable Indian format */
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = await req.json();

    // ── 1. Verify Razorpay HMAC signature ────────────────────────────────────
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const expectedSignature = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);

    if (expectedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ verified: false, error: "Signature mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 2. Update payment record ──────────────────────────────────────────────
    await supabaseAdmin
      .from("payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "captured",
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id);

    // ── 3. Confirm the booking ────────────────────────────────────────────────
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", booking_id)
      .select()
      .single();

    if (error) throw error;

    // ── 4. System log ─────────────────────────────────────────────────────────
    await supabaseAdmin.from("system_logs").insert({
      action: "booking_confirmed_via_payment",
      entity: "bookings",
      entity_id: booking_id,
      metadata: { razorpay_order_id, razorpay_payment_id },
    });

    // ── 5. Send SMS notifications (fire-and-forget — don't block the response) ─
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const smsFunctionUrl = `${supabaseUrl}/functions/v1/send-sms-hook`;

    const smsHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    };

    // 5a. Guest booking confirmation SMS
    if (booking?.guest_phone) {
      fetch(smsFunctionUrl, {
        method: "POST",
        headers: smsHeaders,
        body: JSON.stringify({
          action: "send_booking_sms",
          phone: booking.guest_phone,
          guest_name: booking.guest_name,
          check_in: fmtDate(booking.check_in),
          check_out: fmtDate(booking.check_out),
          num_guests: booking.num_guests,
          booking_reference: booking.booking_reference,
        }),
      })
        .then((r) => r.json())
        .then((d) => console.log("[verify-razorpay-payment] Guest SMS:", JSON.stringify(d)))
        .catch((e) => console.error("[verify-razorpay-payment] Guest SMS error:", e));
    }

    // 5b. Admin notification SMS
    fetch(smsFunctionUrl, {
      method: "POST",
      headers: smsHeaders,
      body: JSON.stringify({
        action: "send_admin_sms",
        guest_name: booking?.guest_name ?? "",
        guest_phone: booking?.guest_phone ?? "",
        check_in: fmtDate(booking?.check_in ?? ""),
        check_out: fmtDate(booking?.check_out ?? ""),
        num_guests: booking?.num_guests,
        booking_id: booking_id,
        booking_reference: booking?.booking_reference ?? "",
        total_amount: booking?.total_amount ?? 0,
      }),
    })
      .then((r) => r.json())
      .then((d) => console.log("[verify-razorpay-payment] Admin SMS:", JSON.stringify(d)))
      .catch((e) => console.error("[verify-razorpay-payment] Admin SMS error:", e));

    // ── 6. Return success to the frontend ────────────────────────────────────
    return new Response(JSON.stringify({ verified: true, booking }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ verified: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
