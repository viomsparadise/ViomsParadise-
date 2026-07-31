import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

// All MSG91 API calls are routed through this Supabase Edge Function.
// API keys are stored as Edge Function secrets — never in the React bundle.
const SMS_HOOK = "send-sms-hook";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<{ error: string | null; secondsLeft?: number }>;
  resendPhoneOtp: (phone: string) => Promise<{ error: string | null; secondsLeft?: number }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadUserContext(userId: string) {
    const [{ data: profileRow }, { data: adminRow }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("admin_users").select("id").eq("user_id", userId).maybeSingle(),
    ]);
    setProfile(profileRow ?? null);
    setIsAdmin(!!adminRow);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadUserContext(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await loadUserContext(newSession.user.id);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string, fullName: string, phone: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    return { error: error?.message ?? null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  }

  async function refreshProfile() {
    if (session?.user) await loadUserContext(session.user.id);
  }

  // ─── MSG91 OTP via Edge Function ───────────────────────────────────────────
  // All MSG91 secrets (auth key, template IDs) live in Edge Function secrets.
  // The frontend never touches MSG91 directly.

  async function sendPhoneOtp(phone: string): Promise<{ error: string | null; secondsLeft?: number }> {
    const { data, error } = await supabase.functions.invoke(SMS_HOOK, {
      body: { action: "send_otp", phone },
    });
    if (error) return { error: error.message };
    if (data?.secondsLeft) return { error: data.error ?? null, secondsLeft: data.secondsLeft };
    if (data?.error) return { error: data.error };
    return { error: null };
  }

  async function resendPhoneOtp(phone: string): Promise<{ error: string | null; secondsLeft?: number }> {
    const { data, error } = await supabase.functions.invoke(SMS_HOOK, {
      body: { action: "resend_otp", phone },
    });
    if (error) return { error: error.message };
    if (data?.secondsLeft) return { error: data.error ?? null, secondsLeft: data.secondsLeft };
    if (data?.error) return { error: data.error };
    return { error: null };
  }

  async function verifyPhoneOtp(phone: string, token: string): Promise<{ error: string | null }> {
    const { data, error } = await supabase.functions.invoke(SMS_HOOK, {
      body: { action: "verify_otp", phone, otp: token },
    });
    if (error) return { error: error.message };
    if (!data?.verified) return { error: data?.error ?? "OTP verification failed" };

    // If the Edge Function returned a full session, set it on the Supabase client.
    // This happens when createSession is supported (Supabase JS v2 + Supabase platform).
    if (data.access_token && data.refresh_token) {
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionErr) return { error: sessionErr.message };
    } else if (data.user_id) {
      // Fallback: session couldn't be auto-created (older Supabase version).
      // The user is registered; ask them to sign in again or refresh.
      console.warn("[AuthContext] Session tokens not returned — user registered but not signed in.");
      return { error: null }; // treated as success; UI can redirect to a re-login step if needed.
    }

    return { error: null };
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isAdmin,
        loading,
        signUp,
        signIn,
        signOut,
        requestPasswordReset,
        updatePassword,
        refreshProfile,
        sendPhoneOtp,
        resendPhoneOtp,
        verifyPhoneOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
