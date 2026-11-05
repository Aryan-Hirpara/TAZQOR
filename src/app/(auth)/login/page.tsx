"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { TazqorLogo } from "@/components/brand/TazqorLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.error || "Invalid email or password. Please try again.";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      toast.success("Welcome back to TAZQOR");
      router.push(returnUrl);
      router.refresh();
    } catch {
      const msg = "Unable to connect to the authentication service. Please retry.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("owner@tazqor.com");
    setPassword("Tazqor@2026");
    setErrorMessage("");
  };

  return (
    <div className="bg-white/60 backdrop-blur-2xl rounded-[32px] p-7 sm:p-10 border border-white/75 shadow-none space-y-6">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center">
        <TazqorLogo className="h-10 w-auto object-contain mb-2" height={40} />
        <h2 className="text-sm font-medium text-neutral-800 tracking-tight">
          Business Management System
        </h2>
        <p className="text-xs text-neutral-500 font-light mt-0.5">
          Sign in to access store operations & ledgers
        </p>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200/60 text-xs text-rose-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span className="font-light">{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-normal text-neutral-700 mb-1.5">
            Admin Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage("");
              }}
              placeholder="owner@tazqor.com"
              required
              autoComplete="username"
              className="w-full h-11 pl-10 pr-4 text-xs bg-white/70 backdrop-blur-md rounded-full border border-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D7FF00] transition-all font-light text-neutral-900 placeholder-neutral-400"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-normal text-neutral-700">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage("");
              }}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              className="w-full h-11 pl-10 pr-12 text-xs bg-white/70 backdrop-blur-md rounded-full border border-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D7FF00] transition-all font-light text-neutral-900 placeholder-neutral-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-4 rounded-full bg-black text-white font-normal text-xs sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-none"
        >
          {loading ? (
            <span>Verifying credentials...</span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 text-[#D7FF00]" />
            </>
          )}
        </button>
      </form>

      {/* Quick Fill / Credentials Hint */}
      <div className="pt-4 border-t border-white/60 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-light">
          <span>Owner Demo Credentials:</span>
          <button
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1 text-neutral-900 font-medium hover:underline cursor-pointer"
          >
            <KeyRound className="w-3 h-3 text-neutral-700" />
            <span>Fill Admin Info</span>
          </button>
        </div>
        <p className="text-[10px] text-neutral-400 font-light text-center">
          Single-owner instance. Self-registration is disabled for security.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-500 font-light">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
