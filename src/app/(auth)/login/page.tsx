"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { TazqorLogo } from "@/components/brand/TazqorLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If demo/dev credentials or Supabase not linked, allow owner access in dev
        if (
          process.env.NODE_ENV === "development" ||
          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
        ) {
          toast.success("Welcome back to TAZQOR (Dev Mode)");
          router.push("/dashboard");
          return;
        }
        toast.error(error.message || "Invalid login credentials");
        return;
      }

      toast.success("Welcome back to TAZQOR");
      router.push("/dashboard");
    } catch {
      toast.error("An error occurred during sign-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 border border-white/75 shadow-2xl shadow-black/5">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <TazqorLogo className="h-10 w-auto object-contain mb-3" height={40} />
        <p className="text-xs tracking-wider text-neutral-500 font-light mt-1">
          Business Management System
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Admin Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@tazqor.com"
              required
              className="w-full h-11 pl-10 pr-4 text-xs bg-white/70 rounded-full border border-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E0FE52] transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-light text-neutral-700">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full h-11 pl-10 pr-10 text-xs bg-white/70 rounded-full border border-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E0FE52] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-6 rounded-full bg-black text-white font-normal text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-neutral-900 active:scale-[0.99] transition-all disabled:opacity-60 shadow-md"
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4 text-[#E0FE52]" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-[11px] text-gray-400">
          Private single-owner system. Public self-registration is disabled.
        </p>
      </div>
    </div>
  );
}

