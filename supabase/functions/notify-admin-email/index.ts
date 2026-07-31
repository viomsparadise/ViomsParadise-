// Supabase Edge Function: notify-admin-email
// Deploy: supabase functions deploy notify-admin-email
// Secrets: supabase secrets set RESEND_API_KEY=... ADMIN_NOTIFICATION_EMAIL=owner@example.com
//
// This is NOT called automatically by Postgres — triggers can't reach the
// internet directly. Instead, wire it up once in the Supabase Dashboard:
//   Database → Webhooks → Create a new webhook
//     Table: public.notifications
//     Events: Insert
//     Type: Supabase Edge Function
//     Edge Function: notify-admin-email
// After that, every new row in `notifications` (i.e. every confirmed
// booking) automatically triggers this function and emails the admin.
//
// Uses Resend (resend.com) since it's the simplest transactional email API
// to set up with just an API key — swap the fetch call below for any other
// provider (Postmark, SendGrid, etc.) if you prefer.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    // Database Webhooks send { type, table, record, old_record, schema }
    const booking = payload.record ?? payload;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");

    if (!resendKey || !adminEmail) {
      // Not configured yet — fail quietly rather than breaking the booking flow.
      return new Response(JSON.stringify({ skipped: true, reason: "Email notifications not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <h2>New booking confirmed — Viom's Paradise</h2>
      <p><strong>Reference:</strong> ${booking.booking_reference ?? ""}</p>
      <p><strong>Guest:</strong> ${booking.guest_name ?? ""}</p>
      <p><strong>Phone:</strong> ${booking.guest_phone ?? ""}</p>
      <p><strong>Email:</strong> ${booking.guest_email ?? ""}</p>
      <p><strong>Check-in:</strong> ${booking.check_in ?? ""}</p>
      <p><strong>Check-out:</strong> ${booking.check_out ?? ""}</p>
      <p><strong>Guests:</strong> ${booking.num_guests ?? ""}</p>
      <p><strong>Total:</strong> ₹${booking.total_amount ?? ""}</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Viom's Paradise <bookings@yourdomain.com>", // must be a domain verified in your Resend account
        to: [adminEmail],
        subject: `New booking: ${booking.guest_name ?? "Guest"} (${booking.booking_reference ?? ""})`,
        html,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
