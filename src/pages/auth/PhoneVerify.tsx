import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function PhoneVerify() {
  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/dashboard";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return setError("Enter a valid 10-digit phone number.");

    setLoading(true);
    const { error } = await sendPhoneOtp(phone);
    setLoading(false);
    if (error) return setError(error);
    toast.success("OTP sent via SMS");
    setStep("otp");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp.length < 4) return setError("Enter the code you received.");

    setLoading(true);
    const { error } = await verifyPhoneOtp(phone, otp);
    setLoading(false);
    if (error) return setError(error);
    toast.success("Phone verified");
    navigate(from, { replace: true });
  }

  return (
    <AuthShell
      eyebrow="Verify Your Number"
      title={step === "phone" ? "Enter your phone number" : "Enter the OTP"}
      subtitle={
        step === "phone"
          ? "We'll text you a one-time code — no password needed."
          : `Code sent to ${phone}.`
      }
    >
      {step === "phone" ? (
        <motion.form key="phone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <Label htmlFor="phone"><Phone className="mr-1 inline h-3.5 w-3.5" /> Phone number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2"
              autoFocus
            />
            <p className="mt-1 text-xs text-forest-900/40">10-digit Indian mobile number</p>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Send OTP
          </Button>
        </motion.form>
      ) : (
        <motion.form key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <Label htmlFor="otp">One-time code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-2 text-center text-lg tracking-[0.5em]"
              maxLength={6}
              autoFocus
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Verify & Continue
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setOtp("");
              setError(null);
            }}
            className="block w-full text-center text-sm text-forest-900/50 underline"
          >
            Use a different number
          </button>
        </motion.form>
      )}
      <p className="mt-6 text-center text-xs text-forest-900/40">
        Admin?{" "}
        <Link to="/admin/login" className="underline">
          Sign in here
        </Link>
      </p>
    </AuthShell>
  );
}
