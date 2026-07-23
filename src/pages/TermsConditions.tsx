import { LegalLayout, LegalSection } from "@/components/layout/LegalLayout";

export default function TermsConditions() {
  return (
    <LegalLayout eyebrow="Legal" title="Terms & Conditions" updated="12 July 2026">
      <LegalSection title="1. Bookings">
        <p>
          All bookings made through this website are confirmed only after successful online payment via
          Razorpay. A booking reference and confirmation are issued immediately upon payment success.
        </p>
      </LegalSection>
      <LegalSection title="2. Meals & Dining">
        <p>
          Viom's Paradise is a self-catered luxury home stay, and there is no in-house restaurant on the
          property. Guests are responsible for arranging their own meals — bringing provisions or ordering
          from nearby establishments. To make this easier, our website includes a built-in restaurant finder
          that helps you search for well-rated restaurants near the property.
        </p>
      </LegalSection>
      <LegalSection title="3. Check-in & Check-out">
        <p>
          Standard check-in begins at 1:00 PM and check-out is by 11:00 AM. Early check-in and late check-out
          requests are accommodated where possible, subject to availability, and may carry an additional charge.
        </p>
      </LegalSection>
      <LegalSection title="4. Guest Conduct">
        <p>
          Guests are expected to treat the property, staff, and neighbouring residents with respect. Viom's
          Paradise reserves the right to end a stay without refund in cases of serious misconduct, property
          damage, or violation of local law.
        </p>
      </LegalSection>
      <LegalSection title="5. Liability">
        <p>
          Viom's Paradise takes reasonable care to maintain a safe property but is not liable for loss, theft,
          or injury arising from guest negligence or activities undertaken outside the property, including
          nearby attractions and excursions.
        </p>
      </LegalSection>
      <LegalSection title="6. Changes to These Terms">
        <p>We may update these terms from time to time; the version in effect at the time of your booking applies to your stay.</p>
      </LegalSection>
    </LegalLayout>
  );
}
