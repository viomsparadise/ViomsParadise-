import { LegalLayout, LegalSection } from "@/components/layout/LegalLayout";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function PrivacyPolicy() {
  const { settings } = useSiteSettings();
  return (
    <LegalLayout eyebrow="Legal" title="Privacy Policy" updated="12 July 2026">
      <LegalSection title="1. What We Collect">
        <p>
          When you create an account or make a booking with Viom's Paradise, we collect your name, email
          address, phone number, and the booking details you provide (dates, guest count, special requests).
          When you pay online, payment processing is handled by Razorpay — we store only the payment status,
          order reference, and transaction ID, never your full card or bank details.
        </p>
      </LegalSection>
      <LegalSection title="2. How We Use Your Information">
        <p>
          We use your information to process bookings, send confirmations, respond to enquiries, and improve
          our service. We do not sell or rent guest data to third parties. Where you consent, we may send
          occasional updates about the property.
        </p>
      </LegalSection>
      <LegalSection title="3. Data Storage & Security">
        <p>
          Guest data is stored on Supabase infrastructure with row-level security, meaning your booking and
          profile information is only accessible to you and authorised Viom's Paradise administrators.
          Passwords are managed entirely by Supabase Auth and are never visible to our team.
        </p>
      </LegalSection>
      <LegalSection title="4. Cookies">
        <p>
          Our website uses essential cookies required for authentication sessions. We do not use third-party
          advertising trackers.
        </p>
      </LegalSection>
      <LegalSection title="5. Your Rights">
        <p>
          You may request a copy of your data, ask us to correct it, or request deletion of your account by
          contacting us at the details on our Contact page, subject to statutory record-keeping requirements
          for completed bookings and payments.
        </p>
      </LegalSection>
      <LegalSection title="6. Contact">
        <p>For any privacy-related questions, please reach out via our Contact page or write to {settings.contact_email}.</p>
      </LegalSection>
    </LegalLayout>
  );
}
