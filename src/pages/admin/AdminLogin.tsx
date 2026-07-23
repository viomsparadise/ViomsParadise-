import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function AdminLogin() {
  const { signIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) return setError(error);
    // AuthContext resolves isAdmin async on the next tick; AdminRoute will
    // gate access, but we optimistically navigate to /admin either way.
    navigate("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-950 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-ivory/10 bg-forest-900 p-8 text-ivory shadow-luxury">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-gold" />
          <p className="eyebrow text-gold">Admin Access</p>
        </div>
        <h1 className="mt-3 font-display text-2xl">Viom's Paradise Control Panel</h1>
        <p className="mt-1 text-sm text-ivory/50">{isAdmin ? "You're already signed in as an admin." : "Sign in with your administrator account."}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="email" className="text-ivory/60">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 border-ivory/15 bg-ivory/5 text-ivory placeholder:text-ivory/30" />
          </div>
          <div>
            <Label htmlFor="password" className="text-ivory/60">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 border-ivory/15 bg-ivory/5 text-ivory placeholder:text-ivory/30" />
          </div>
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign In
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-ivory/30">
          Admin access is granted via the <code className="rounded bg-ivory/10 px-1">admin_users</code> table — contact the property owner if you need access.
        </p>
      </div>
    </div>
  );
}
