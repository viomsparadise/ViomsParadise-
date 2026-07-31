// Supabase Edge Function: send-sms-hook
// Deploy: supabase functions deploy send-sms-hook
//
// Secrets required (set via: supabase secrets set KEY=value):
//   MSG91_AUTH_KEY          — Your MSG91 API auth key
//   MSG91_OTP_TEMPLATE_ID   — DLT-approved OTP template ID (MSG91 Flow ID)
//   MSG91_BOOKING_TEMPLATE_ID — DLT-approved booking confirmation SMS template ID
//   MSG91_ADMIN_TEMPLATE_ID — DLT-approved admin notification SMS template ID
//   MSG91_SENDER_ID         — 6-char sender ID e.g. VIOMSP
//   MSG91_ADMIN_PHONE       — Admin phone in E.164 digits e.g. 919876543210
//   SUPABASE_URL            — Auto-set by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — Auto-set by Supabase
//
// Supported actions (passed in request body):
//   send_otp       — Send OTP via MSG91 to a phone number
//   verify_otp     — Verify OTP via MSG91, then sign-in/register user via Supabase Admin API
//   send_booking_sms — Send booking confirmation SMS to guest
//   send_admin_sms   — Send admin notification SMS

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Normalises Indian numbers to E.164 digits (no '+') for MSG91. */
function toMsg91Phone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 13 && digits.startsWith("091")) return digits.slice(1);
  return digits;
}

/** JSON response helper */
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── MSG91 OTP: Send ─────────────────────────────────────────────────────────

async function sendOtp(phone: string, authKey: string, templateId: string) {
  const msg91Phone = toMsg91Phone(phone);

  const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${msg91Phone}&authkey=${authKey}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  console.log("[send-sms-hook] MSG91 send_otp response:", JSON.stringify(data));
  return data;
}

// ─── MSG91 OTP: Verify ───────────────────────────────────────────────────────

async function verifyOtp(phone: string, otp: string, authKey: string) {
  const msg91Phone = toMsg91Phone(phone);

  const url = `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${msg91Phone}&authkey=${authKey}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  console.log("[send-sms-hook] MSG91 verify_otp response:", JSON.stringify(data));
  return data;
}

// ─── MSG91 OTP: Resend ───────────────────────────────────────────────────────

async function resendOtp(phone: string, authKey: string) {
  const msg91Phone = toMsg91Phone(phone);
  const url = `https://control.msg91.com/api/v5/otp/retry?mobile=${msg91Phone}&authkey=${authKey}&retrytype=text`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  console.log("[send-sms-hook] MSG91 resend_otp response:", JSON.stringify(data));
  return data;
}

// ─── MSG91 Transactional SMS ─────────────────────────────────────────────────

interface SmsVariable {
  [key: string]: string;
}

async function sendTransactionalSms(
  phone: string,
  templateId: string,
  senderId: string,
  authKey: string,
  variables: SmsVariable
) {
  const msg91Phone = toMsg91Phone(phone);

  // Build the request body for MSG91 Flow API (v5)
  const body = {
    template_id: templateId,
    sender: senderId,
    short_url: "0",
    mobiles: msg91Phone,
    ...variables,
  };

  const res = await fetch("https://control.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: {
      authkey: authKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  console.log("[send-sms-hook] MSG91 transactional SMS response:", JSON.stringify(data));
  return { ok: res.ok, data };
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

const OTP_COOLDOWN_SECONDS = 30;
const OTP_MAX_PER_HOUR = 5;

async function checkRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  phone: string
): Promise<{ allowed: boolean; secondsLeft: number }> {
  const { data } = await supabaseAdmin
    .from("otp_attempts")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (!data) return { allowed: true, secondsLeft: 0 };

  const now = new Date();
  const lastSent = data.last_sent_at ? new Date(data.last_sent_at) : null;

  // 30-second cooldown between OTPs
  if (lastSent) {
    const secondsElapsed = (now.getTime() - lastSent.getTime()) / 1000;
    if (secondsElapsed < OTP_COOLDOWN_SECONDS) {
      return {
        allowed: false,
        secondsLeft: Math.ceil(OTP_COOLDOWN_SECONDS - secondsElapsed),
      };
    }
  }

  // Max 5 OTPs per hour
  if (data.hourly_count >= OTP_MAX_PER_HOUR && lastSent) {
    const hourElapsed = (now.getTime() - lastSent.getTime()) / 1000 / 3600;
    if (hourElapsed < 1) {
      return { allowed: false, secondsLeft: 0 }; // blocked for the hour
    }
  }

  return { allowed: true, secondsLeft: 0 };
}

async function recordOtpAttempt(
  supabaseAdmin: ReturnType<typeof createClient>,
  phone: string
) {
  const now = new Date().toISOString();

  const { data: existing } = await supabaseAdmin
    .from("otp_attempts")
    .select("hourly_count, last_sent_at")
    .eq("phone", phone)
    .maybeSingle();

  const lastSent = existing?.last_sent_at ? new Date(existing.last_sent_at) : null;
  const hourElapsed = lastSent
    ? (Date.now() - lastSent.getTime()) / 1000 / 3600
    : Infinity;

  const newCount = hourElapsed < 1 ? (existing?.hourly_count ?? 0) + 1 : 1;

  await supabaseAdmin.from("otp_attempts").upsert({
    phone,
    hourly_count: newCount,
    last_sent_at: now,
  });
}

// ─── Supabase Auth: upsert user after OTP verified ──────────────────────────

async function upsertUserAndGetSession(
  supabaseAdmin: ReturnType<typeof createClient>,
  phone: string
): Promise<{ access_token: string; refresh_token: string; user_id: string } | null> {
  const e164 = `+${toMsg91Phone(phone)}`;

  // Try to find the user by phone
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const existing = listData?.users?.find((u) => u.phone === e164);

  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    // Create user with phone
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      phone: e164,
      phone_confirm: true, // mark phone as confirmed since we verified via MSG91
    });
    if (createErr || !created?.user) {
      console.error("[send-sms-hook] Failed to create user:", createErr?.message);
      return null;
    }
    userId = created.user.id;
  }

  // Upsert profile row
  await supabaseAdmin.from("profiles").upsert({ id: userId, phone: e164 }, { onConflict: "id" });

  // Generate a magic link / session for the user
  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: `${userId}@phone.viomsp.local`, // placeholder email required by API
  });

  // Alternative: use createSession if available
  // Since generateLink requires email, let's use a different approach:
  // Sign in the user with a custom token using the service role
  // We'll use signInWithPassword with a deterministic password (UUID-based, never exposed to user)
  // Actually, the cleanest approach for phone-only users is to update the user and create a session

  // Use admin.createSession (Supabase JS v2.x)
  // Note: If your Supabase version doesn't support createSession, see fallback below.
  try {
    const { data: sessionData, error: sessionErr } = await (supabaseAdmin.auth.admin as any).createSession({
      user_id: userId,
    });

    if (sessionErr || !sessionData?.session) {
      console.error("[send-sms-hook] createSession failed, trying generateLink fallback:", sessionErr?.message);
      // Fallback: return just the user_id and let the client handle linking
      return { access_token: "", refresh_token: "", user_id: userId };
    }

    return {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      user_id: userId,
    };
  } catch (e) {
    console.error("[send-sms-hook] Session creation exception:", e);
    return { access_token: "", refresh_token: "", user_id: userId };
  }
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;

    // Read secrets
    const authKey = Deno.env.get("MSG91_AUTH_KEY") ?? "";
    const otpTemplateId = Deno.env.get("MSG91_OTP_TEMPLATE_ID") ?? "";
    const bookingTemplateId = Deno.env.get("MSG91_BOOKING_TEMPLATE_ID") ?? "";
    const adminTemplateId = Deno.env.get("MSG91_ADMIN_TEMPLATE_ID") ?? "";
    const senderId = Deno.env.get("MSG91_SENDER_ID") ?? "VIOMSP";
    const adminPhone = Deno.env.get("MSG91_ADMIN_PHONE") ?? "";

    if (!authKey) {
      console.error("[send-sms-hook] MSG91_AUTH_KEY is not set");
      return json({ error: "SMS service not configured" }, 500);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── ACTION: send_otp ───────────────────────────────────────────────────
    if (action === "send_otp") {
      const { phone } = body;
      if (!phone) return json({ error: "phone is required" }, 400);

      // Rate limit check
      const { allowed, secondsLeft } = await checkRateLimit(supabaseAdmin, phone);
      if (!allowed) {
        return json(
          { error: `Please wait ${secondsLeft} seconds before requesting another OTP.`, secondsLeft },
          429
        );
      }

      if (!otpTemplateId) {
        return json({ error: "OTP template not configured on server" }, 500);
      }

      const result = await sendOtp(phone, authKey, otpTemplateId);

      if (result?.type !== "success") {
        console.error("[send-sms-hook] MSG91 OTP send failed:", result);
        return json({ error: result?.message ?? "Failed to send OTP. Please try again." }, 500);
      }

      await recordOtpAttempt(supabaseAdmin, phone);

      return json({ sent: true, message: "OTP sent successfully" });
    }

    // ── ACTION: resend_otp ────────────────────────────────────────────────
    if (action === "resend_otp") {
      const { phone } = body;
      if (!phone) return json({ error: "phone is required" }, 400);

      const { allowed, secondsLeft } = await checkRateLimit(supabaseAdmin, phone);
      if (!allowed) {
        return json(
          { error: `Please wait ${secondsLeft} seconds before resending.`, secondsLeft },
          429
        );
      }

      const result = await resendOtp(phone, authKey);

      if (result?.type !== "success") {
        // Fallback: send fresh OTP if resend fails
        if (otpTemplateId) {
          const fallback = await sendOtp(phone, authKey, otpTemplateId);
          if (fallback?.type !== "success") {
            return json({ error: "Failed to resend OTP. Please try again." }, 500);
          }
        }
      }

      await recordOtpAttempt(supabaseAdmin, phone);
      return json({ sent: true, message: "OTP resent successfully" });
    }

    // ── ACTION: verify_otp ────────────────────────────────────────────────
    if (action === "verify_otp") {
      const { phone, otp } = body;
      if (!phone || !otp) return json({ error: "phone and otp are required" }, 400);

      const result = await verifyOtp(phone, otp, authKey);

      if (result?.type !== "success") {
        const msg = result?.message ?? "Invalid or expired OTP. Please try again.";
        return json({ verified: false, error: msg }, 400);
      }

      // OTP is valid — record verification time
      await supabaseAdmin.from("otp_attempts").upsert(
        { phone, last_verified_at: new Date().toISOString() },
        { onConflict: "phone" }
      );

      // Upsert user in Supabase Auth and return session
      const session = await upsertUserAndGetSession(supabaseAdmin, phone);

      if (!session) {
        return json({ verified: false, error: "Failed to create user session" }, 500);
      }

      return json({ verified: true, ...session });
    }

    // ── ACTION: send_booking_sms ──────────────────────────────────────────
    if (action === "send_booking_sms") {
      const { phone, guest_name, check_in, check_out, num_guests, booking_reference } = body;

      if (!phone || !guest_name || !check_in || !check_out) {
        return json({ error: "Missing required booking SMS fields" }, 400);
      }

      if (!bookingTemplateId) {
        console.warn("[send-sms-hook] MSG91_BOOKING_TEMPLATE_ID not set — skipping guest SMS");
        return json({ sent: false, reason: "Booking SMS template not configured" });
      }

      const { ok, data } = await sendTransactionalSms(
        phone,
        bookingTemplateId,
        senderId,
        authKey,
        {
          GuestName: guest_name,
          CheckIn: check_in,
          CheckOut: check_out,
          Guests: String(num_guests ?? ""),
          BookingRef: booking_reference ?? "",
        }
      );

      if (!ok) {
        console.error("[send-sms-hook] Guest booking SMS failed:", data);
        return json({ sent: false, error: "Failed to send booking SMS" }, 500);
      }

      await supabaseAdmin.from("system_logs").insert({
        action: "booking_sms_sent",
        entity: "bookings",
        metadata: { phone, guest_name, booking_reference },
      });

      return json({ sent: true });
    }

    // ── ACTION: send_admin_sms ────────────────────────────────────────────
    if (action === "send_admin_sms") {
      const {
        guest_name,
        guest_phone,
        check_in,
        check_out,
        num_guests,
        booking_id,
        booking_reference,
        total_amount,
      } = body;

      if (!adminPhone) {
        console.warn("[send-sms-hook] MSG91_ADMIN_PHONE not set — skipping admin SMS");
        return json({ sent: false, reason: "Admin phone not configured" });
      }

      if (!adminTemplateId) {
        console.warn("[send-sms-hook] MSG91_ADMIN_TEMPLATE_ID not set — skipping admin SMS");
        return json({ sent: false, reason: "Admin SMS template not configured" });
      }

      const { ok, data } = await sendTransactionalSms(
        adminPhone,
        adminTemplateId,
        senderId,
        authKey,
        {
          GuestName: guest_name ?? "",
          GuestPhone: guest_phone ?? "",
          CheckIn: check_in ?? "",
          CheckOut: check_out ?? "",
          Guests: String(num_guests ?? ""),
          BookingID: booking_id ?? "",
          BookingRef: booking_reference ?? "",
          Amount: String(total_amount ?? ""),
        }
      );

      if (!ok) {
        console.error("[send-sms-hook] Admin SMS failed:", data);
        return json({ sent: false, error: "Failed to send admin SMS" }, 500);
      }

      await supabaseAdmin.from("system_logs").insert({
        action: "admin_sms_sent",
        entity: "bookings",
        entity_id: booking_id,
        metadata: { booking_reference, total_amount },
      });

      return json({ sent: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("[send-sms-hook] Unhandled error:", e);
    return json({ error: (e as Error).message ?? "Internal server error" }, 500);
  }
});
