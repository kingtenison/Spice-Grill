"use client";

import { useState } from "react";
import { ArrowRight, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { signInWithPassword, signInWithGoogle } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const { data, error } = await signInWithPassword(email, password);

    if (error) {
      setMessage("Error: " + error.message);
    } else if (data?.user) {
      setMessage("Success! Redirecting...");

      // Role-based redirect: send admins/employees straight to their panels
      setTimeout(async () => {
        try {
          const supabase = createClient();
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user!.id)
            .single();

          const role = profile?.role;
          if (role === "admin") {
            window.location.href = "/admin";
          } else if (role === "employee") {
            window.location.href = "/employee";
          } else {
            window.location.href = "/menu";
          }
        } catch {
          window.location.href = "/menu";
        }
      }, 700);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">

      <main className="flex-grow flex items-center justify-center p-4 -mt-16">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="p-8 md:p-12 rounded-2xl bg-white border border-gray-200 shadow-xl"
          >
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold mb-3 text-gray-900">Welcome Back</h1>
              <p className="text-gray-600">Sign in to track your orders and earn rewards.</p>
            </div>

            {message && (
              <div className={cn(
                "mb-6 p-4 rounded-lg text-sm font-medium",
                message.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
              )}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900 placeholder:text-gray-400"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 transition-all disabled:bg-gray-300 shadow-lg shadow-red-500/20"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or continue with</span>
                </div>
              </div>

              <button
                onClick={async () => {
                  const { error } = await signInWithGoogle();
                  if (error) setMessage("Error: " + error.message);
                }}
                className="mt-4 w-full py-3 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-red-600 hover:text-red-700 transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}