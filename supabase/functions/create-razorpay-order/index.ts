// Supabase Edge Function: create-razorpay-order
// Deploy: supabase functions deploy create-razorpay-order
// Secrets: supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=...
//
// Creates a Razorpay order for a given booking_id. The amount is looked up
// from the `bookings` table server-side (via the service role key) so a
// malicious client can never alter the price paid.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("id, total_amount, status, booking_reference")
      .eq("id", booking_id)
      .single();

    if (error || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (booking.status !== "pending_payment") {
      return new Response(JSON.stringify({ error: "Booking is not awaiting payment" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const amountInPaise = Math.round(Number(booking.total_amount) * 100);

    const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: booking.booking_reference,
        notes: { booking_id: booking.id },
      }),
    });

    const order = await rpRes.json();
    if (!rpRes.ok) {
      return new Response(JSON.stringify({ error: order?.error?.description ?? "Razorpay order creation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin.from("payments").insert({
      booking_id: booking.id,
      razorpay_order_id: order.id,
      amount: booking.total_amount,
      status: "created",
    });

    return new Response(
      JSON.stringify({ order_id: order.id, amount: amountInPaise, currency: "INR", key_id: keyId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
