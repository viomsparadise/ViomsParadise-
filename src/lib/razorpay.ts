import { supabase } from "./supabase";

declare global {
  interface Window {
    Razorpay: any;
  }
}

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return scriptPromise;
}

interface StartPaymentArgs {
  bookingId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (message: string) => void;
}

/**
 * Full secure Razorpay flow:
 * 1. Ask our Edge Function to create a Razorpay order (amount is derived
 *    server-side from the booking row — never trust a client-supplied amount).
 * 2. Open Razorpay Checkout with that order id.
 * 3. Send the returned payment_id/order_id/signature to our Edge Function to
 *    verify the HMAC signature and flip the booking to `confirmed`.
 */
export async function startRazorpayPayment({
  bookingId,
  guestName,
  guestEmail,
  guestPhone,
  onSuccess,
  onFailure,
}: StartPaymentArgs) {
  const loaded = await loadRazorpayScript();
  if (!loaded) return onFailure("Could not load the payment gateway. Check your connection and try again.");

  const { data: orderData, error: orderError } = await supabase.functions.invoke("create-razorpay-order", {
    body: { booking_id: bookingId },
  });

  if (orderError || !orderData?.order_id) {
    return onFailure(orderData?.error ?? orderError?.message ?? "Could not initiate payment.");
  }

  const rzp = new window.Razorpay({
    key: orderData.key_id,
    amount: orderData.amount,
    currency: orderData.currency,
    name: "Viom's Paradise",
    description: "Luxury Home Stay Booking",
    order_id: orderData.order_id,
    prefill: { name: guestName, email: guestEmail, contact: guestPhone },
    theme: { color: "#1F3329" },
    handler: async (response: any) => {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-razorpay-payment", {
        body: {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          booking_id: bookingId,
        },
      });

      if (verifyError || !verifyData?.verified) {
        return onFailure("Payment verification failed. If money was deducted, it will be auto-refunded within 5-7 days.");
      }
      onSuccess(response.razorpay_payment_id);
    },
    modal: {
      ondismiss: () => onFailure("Payment was cancelled."),
    },
  });

  rzp.on("payment.failed", (resp: any) => onFailure(resp?.error?.description ?? "Payment failed."));
  rzp.open();
}
