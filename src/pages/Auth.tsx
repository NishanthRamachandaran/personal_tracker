import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Zap, Mail, ArrowRight, AlertTriangle, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { rateLimiter } from "@/lib/rateLimiter";
import { handleApplicationError } from "@/lib/errorHandler";

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, enableDemoMode } = useAuth();
  
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoNameInput, setDemoNameInput] = useState("");
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Rate Limiter Check with Exponential Backoff
    const limitCheck = rateLimiter.checkAuthLimit(email);
    if (!limitCheck.allowed) {
      const waitSeconds = Math.ceil(limitCheck.retryAfterMs / 1000);
      setError(`Too many auth attempts. Please wait ${waitSeconds}s before retrying.`);
      return;
    }

    try {
      setError(null);
      if (authMode === "signup") {
        if (!password || password.length < 6) {
          setError("Password must be at least 6 characters long.");
          return;
        }
        await signUpWithEmail(email.trim(), password, fullName.trim() || email.split("@")[0]);
        setIsSubmitted(true);
      } else {
        await signInWithEmail(email.trim(), password || undefined);
        rateLimiter.recordAuthAttempt(email, true);
        navigate("/");
      }
    } catch (err: any) {
      rateLimiter.recordAuthAttempt(email, false);
      const sanitized = handleApplicationError(err, "AuthPage:Submit");
      setError(sanitized);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes("provider is not enabled") || errMsg.includes("Unsupported provider")) {
        setError("Google OAuth is not enabled in your Supabase Dashboard yet. Please use Email/Password sign-in or Demo Mode.");
      } else {
        setError(handleApplicationError(err, "AuthPage:GoogleOAuth"));
      }
    }
  };

  const handleStartDemo = (name: string) => {
    const validName = name.trim() || "Guest Tracker";
    enableDemoMode(validName, `${validName.toLowerCase().replace(/\s+/g, ".")}@pulse.app`);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0D12] text-on-surface relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-habit/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-modal p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6 relative z-10 text-center">
        {/* Logo */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-habit via-expense to-health p-0.5 shadow-glow-habit flex items-center justify-center">
          <div className="w-full h-full bg-[#0D0D12] rounded-[22px] flex items-center justify-center">
            <Zap className="w-8 h-8 text-habit-primary stroke-[2.5]" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            {authMode === "signup" ? "Create your Pulse Account" : "Sign in to Pulse"}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            {authMode === "signup" ? "Start tracking Habits, Expenses, Mood & Health" : "Access your personal command center"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface-level2 p-1 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => { setAuthMode("signup"); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              authMode === "signup" ? "bg-habit text-background shadow-glow-habit" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode("login"); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              authMode === "login" ? "bg-habit text-background shadow-glow-habit" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Sign In
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-5 rounded-2xl bg-health/20 border border-health/40 text-health text-xs font-bold space-y-3">
            <p className="text-sm">🎉 Account Created Successfully!</p>
            <p className="text-xs text-on-surface-variant font-normal">
              You can now sign in with your email <strong>{email}</strong> or proceed directly to your command center.
            </p>
            <Button onClick={() => navigate("/")} variant="health" className="w-full py-2.5">
              Enter Command Center
            </Button>
          </div>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-3 text-left">
            {authMode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface-level2 border border-outline/40 text-xs text-on-surface focus:outline-none focus:border-habit placeholder:text-on-surface-variant/40"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface-level2 border border-outline/40 text-xs text-on-surface focus:outline-none focus:border-habit placeholder:text-on-surface-variant/40"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Password {authMode === "login" && "(Optional for Magic Link)"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface-level2 border border-outline/40 text-xs text-on-surface focus:outline-none focus:border-habit placeholder:text-on-surface-variant/40"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-mood/20 border border-mood/40 text-mood text-xs flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" variant="habit" className="w-full py-3">
              {authMode === "signup" ? "Create Account" : "Sign In"} <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        )}

        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline/30" /></div>
          <span className="relative bg-[#0D0D12] px-3 text-[10px] font-bold text-on-surface-variant uppercase">Or</span>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="w-full py-3 rounded-2xl bg-surface-level2 hover:bg-surface-level3 border border-outline/30 text-on-surface font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
          Continue with Google
        </button>

        <div className="pt-2 border-t border-white/5 space-y-2">
          <button
            onClick={() => setShowDemoModal(true)}
            className="text-xs font-semibold text-habit-primary hover:underline"
          >
            Instant Demo Mode (Try without signing in) →
          </button>
        </div>
      </div>

      {/* Demo Name Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md">
          <div className="w-full max-w-sm glass-modal p-6 rounded-3xl border border-white/10 space-y-4 text-left">
            <h3 className="text-base font-bold text-on-surface">Enter Demo User Name</h3>
            <p className="text-xs text-on-surface-variant">Customize the account name displayed on your dashboard:</p>
            <input
              type="text"
              placeholder="Your Name (e.g. Sarah Jenkins)"
              value={demoNameInput}
              onChange={(e) => setDemoNameInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-level2 border border-outline/40 text-xs text-on-surface focus:outline-none focus:border-habit"
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowDemoModal(false)} variant="ghost" className="flex-1">Cancel</Button>
              <Button onClick={() => handleStartDemo(demoNameInput)} variant="habit" className="flex-1">Start Demo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
