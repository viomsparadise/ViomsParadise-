// Supabase Edge Function: verify-razorpay-payment
// Deploy: supabase functions deploy verify-razorpay-payment
//
// Verifies the HMAC-SHA256 signature Razorpay returns after checkout, and
// only then marks the booking as `confirmed` and the payment as `captured`.
// This is the ONLY place a booking should transition to `confirmed` — never
// trust a client-side "payment succeeded" callback alone.

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = await req.json();

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

    await supabaseAdmin
      .from("payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "captured",
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id);

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", booking_id)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("system_logs").insert({
      action: "booking_confirmed_via_payment",
      entity: "bookings",
      entity_id: booking_id,
      metadata: { razorpay_order_id, razorpay_payment_id },
    });

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
