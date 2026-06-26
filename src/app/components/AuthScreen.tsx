import { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import type { AuthResult } from "@/lib/auth";

interface Props {
  isDemoMode: boolean;
  onSignIn: (email: string, password: string) => Promise<AuthResult>;
  onSignUp: (fullName: string, email: string, password: string) => Promise<AuthResult>;
  onGoogle: () => Promise<AuthResult>;
  onResetPassword: (email: string) => Promise<AuthResult>;
  onAuthenticated: () => void;
}

export function AuthScreen({ isDemoMode, onSignIn, onSignUp, onGoogle, onResetPassword, onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [showPass, setShowPass] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const submit = async () => {
    setFeedback(null);
    if (!email.trim()) {
      setFeedback({ type: "error", text: "Enter your email address." });
      return;
    }
    if (mode === "register" && !fullName.trim()) {
      setFeedback({ type: "error", text: "Enter your full name." });
      return;
    }
    if (mode !== "forgot" && password.length < 6) {
      setFeedback({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    const result = mode === "login"
      ? await onSignIn(email.trim(), password)
      : mode === "register"
        ? await onSignUp(fullName.trim(), email.trim(), password)
        : await onResetPassword(email.trim());
    setLoading(false);

    if (result.error) {
      setFeedback({ type: "error", text: result.error });
      return;
    }
    if (mode === "forgot" || result.requiresEmailConfirmation) {
      setFeedback({ type: "success", text: result.message ?? "Check your email for the next step." });
      return;
    }
    onAuthenticated();
  };

  const google = async () => {
    setLoading(true);
    setFeedback(null);
    const result = await onGoogle();
    setLoading(false);
    if (result.error) setFeedback({ type: "error", text: result.error });
    else if (isDemoMode) onAuthenticated();
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b-2 border-foreground bg-accent px-6 pb-9 pt-14 text-foreground shadow-[0_4px_0_#26231d]">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-foreground bg-card shadow-[3px_3px_0_#26231d]">
            <svg width="18" height="18" viewBox="0 0 44 44" fill="none">
              <path d="M8 32L20 12L26 22L32 16L38 32H8Z" fill="#26231D" />
            </svg>
          </div>
          <span style={{ fontWeight: 700 }} className="text-lg">SkillBridge</span>
        </div>
        <h1 style={{ fontWeight: 700 }} className="text-2xl">
          {mode === "login" ? "Welcome back" : mode === "register" ? "Create account" : "Reset password"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login" ? "Sign in to find jobs or offer skills" : mode === "register" ? "Start connecting with opportunities" : "We'll send a reset link to your email"}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8 pb-6 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {mode === "register" && (
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl border-2 border-foreground bg-card py-3.5 pl-11 pr-4 text-foreground shadow-[3px_3px_0_#26231d] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="Email address"
              className="w-full rounded-xl border-2 border-foreground bg-card py-3.5 pl-11 pr-4 text-foreground shadow-[3px_3px_0_#26231d] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {mode !== "forgot" && (
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPass ? "text" : "password"}
                placeholder="Password"
                className="w-full rounded-xl border-2 border-foreground bg-card py-3.5 pl-11 pr-12 text-foreground shadow-[3px_3px_0_#26231d] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {mode === "login" && (
            <button onClick={() => setMode("forgot")} className="text-primary text-sm text-right" style={{ fontWeight: 500 }}>
              Forgot password?
            </button>
          )}

          {feedback && (
            <div className={`flex gap-2 rounded-xl border px-3 py-2.5 text-sm ${feedback.type === "error" ? "border-red-200 bg-red-50 text-destructive" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {feedback.type === "error" ? <AlertCircle size={17} className="mt-0.5 flex-shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 flex-shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {isDemoMode && (
            <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-700">
              Supabase is not configured. Authentication runs locally so the interface remains testable.
            </p>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="mt-2 w-full rounded-2xl border-2 border-foreground bg-primary py-4 text-primary-foreground shadow-[4px_4px_0_#26231d] transition-opacity active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#26231d] disabled:opacity-60"
            style={{ fontWeight: 600 }}
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Send Reset Link"}
          </button>

          {mode !== "forgot" && (
            <>
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-xs">or continue with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Google button */}
              <button onClick={google} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-foreground bg-card py-3.5 shadow-[3px_3px_0_#26231d] transition-colors active:bg-muted disabled:opacity-60">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-foreground text-sm" style={{ fontWeight: 500 }}>Continue with Google</span>
              </button>
            </>
          )}
        </div>

        <div className="flex justify-center gap-1.5 mt-8 text-sm">
          {mode === "login" ? (
            <>
              <span className="text-muted-foreground">Don't have an account?</span>
              <button onClick={() => { setMode("register"); setFeedback(null); }} className="text-primary" style={{ fontWeight: 600 }}>Register</button>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">Already have an account?</span>
              <button onClick={() => { setMode("login"); setFeedback(null); }} className="text-primary" style={{ fontWeight: 600 }}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
