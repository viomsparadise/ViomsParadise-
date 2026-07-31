import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Phone, ShieldCheck, RefreshCw, CheckCircle2 } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const RESEND_COOLDOWN = 30; // seconds

export default function PhoneVerify() {
  const { sendPhoneOtp, resendPhoneOtp, verifyPhoneOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/dashboard";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Resend timer
  const [resendCountdown, setResendCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start the 30-second countdown after OTP is sent
  function startResendTimer(secondsLeft = RESEND_COOLDOWN) {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendCountdown(secondsLeft);
    timerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return setError("Enter a valid 10-digit phone number.");

    setLoading(true);
    const { error: sendErr, secondsLeft } = await sendPhoneOtp(phone);
    setLoading(false);

    if (sendErr) {
      if (secondsLeft) {
        setError(sendErr);
        // Even in the error case, start a visual countdown
        startResendTimer(secondsLeft);
      } else {
        setError(sendErr);
      }
      return;
    }

    toast.success("OTP sent to your mobile number");
    setStep("otp");
    startResendTimer();
  }

  async function handleResendOtp() {
    if (resendCountdown > 0) return;
    setError(null);
    setLoading(true);
    const { error: resendErr, secondsLeft } = await resendPhoneOtp(phone);
    setLoading(false);

    if (resendErr) {
      setError(resendErr);
      if (secondsLeft) startResendTimer(secondsLeft);
      return;
    }

    toast.success("OTP resent successfully");
    setOtp("");
    startResendTimer();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp.length < 4) return setError("Enter the OTP you received.");

    setLoading(true);
    const { error: verifyErr } = await verifyPhoneOtp(phone, otp);
    setLoading(false);

    if (verifyErr) return setError(verifyErr);

    setSuccess(true);
    toast.success("Phone verified successfully!");
    setTimeout(() => navigate(from, { replace: true }), 800);
  }

  return (
    <AuthShell
      eyebrow="Verify Your Number"
      title={step === "phone" ? "Enter your phone number" : "Enter the OTP"}
      subtitle={
        step === "phone"
          ? "We'll text you a one-time code — no password needed."
          : `Code sent to +91 ${phone.replace(/\D/g, "").slice(-10)}.`
      }
    >
      <AnimatePresence mode="wait">
        {step === "phone" ? (
          <motion.form
            key="phone"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSendOtp}
            className="space-y-5"
          >
            <div>
              <Label htmlFor="phone">
                <Phone className="mr-1 inline h-3.5 w-3.5" /> Phone number
              </Label>
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
                disabled={loading}
              />
              <p className="mt-1 text-xs text-forest-900/40">10-digit Indian mobile number</p>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {loading ? "Sending OTP…" : "Send OTP"}
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="otp"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleVerifyOtp}
            className="space-y-5"
          >
            <div>
              <Label htmlFor="otp">One-time code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="• • • • • •"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="mt-2 text-center text-lg tracking-[0.5em]"
                maxLength={6}
                autoFocus
                disabled={loading || success}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
              disabled={loading || success}
            >
              {success ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Verified!
                </>
              ) : loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Verify &amp; Continue
                </>
              )}
            </Button>

            {/* Resend row */}
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                  setResendCountdown(0);
                  if (timerRef.current) clearInterval(timerRef.current);
                }}
                className="text-forest-900/50 underline hover:text-forest-900"
              >
                Change number
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCountdown > 0 || loading}
                className="flex items-center gap-1.5 font-medium text-forest-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
              </button>
            </div>

            {/* Visual countdown progress bar */}
            {resendCountdown > 0 && (
              <div className="h-1 w-full overflow-hidden rounded-full bg-forest-900/10">
                <motion.div
                  className="h-full rounded-full bg-gold"
                  initial={{ width: "100%" }}
                  animate={{ width: `${(resendCountdown / RESEND_COOLDOWN) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>
            )}
          </motion.form>
        )}
      </AnimatePresence>

      <p className="mt-6 text-center text-xs text-forest-900/40">
        Admin?{" "}
        <Link to="/admin/login" className="underline">
          Sign in here
        </Link>
      </p>
    </AuthShell>
  );
}
