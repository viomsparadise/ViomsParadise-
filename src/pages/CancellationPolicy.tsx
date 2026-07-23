import { LegalLayout, LegalSection } from "@/components/layout/LegalLayout";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function CancellationPolicy() {
  const { settings } = useSiteSettings();

  return (
    <LegalLayout eyebrow="Legal" title="Cancellation Policy" updated="12 July 2026">
      <LegalSection title="1. Free Cancellation Window">
        <p>
          Bookings cancelled more than {settings.cancellation_free_hours} hours before the scheduled check-in
          time are eligible for a full refund to the original payment method, processed within 5–7 business days.
        </p>
      </LegalSection>
      <LegalSection title="2. Late Cancellations">
        <p>
          Cancellations made within {settings.cancellation_free_hours} hours of check-in are non-refundable,
          as the room is held exclusively for you and cannot typically be re-let on short notice.
        </p>
      </LegalSection>
      <LegalSection title="3. No-Shows">
        <p>Guests who do not arrive by the end of the scheduled check-in day without prior notice will be treated as a no-show and charged the full booking amount.</p>
      </LegalSection>
      <LegalSection title="4. How to Cancel">
        <p>
          Cancel any upcoming booking directly from your <strong>My Bookings</strong> dashboard, or contact us
          via phone or WhatsApp with your booking reference.
        </p>
      </LegalSection>
      <LegalSection title="5. Refund Processing">
        <p>Approved refunds are issued through Razorpay to your original payment method. Refund status can be tracked from your booking details.</p>
      </LegalSection>
    </LegalLayout>
  );
}
