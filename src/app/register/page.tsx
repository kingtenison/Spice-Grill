"use client";

import { useState } from "react";
import { ArrowRight, Mail, Lock, User, Phone } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { signUpWithPassword, signInWithGoogle } from "@/app/actions/auth";
import { createAuthClientBrowser } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const metadata = {
      full_name: formData.name,
      phone: formData.phone,
    };

    try {
      const { data, error } = await signUpWithPassword(formData.email, formData.password, metadata);

      if (error) {
        setMessage("Error: " + error.message);
      } else if (data?.user) {
        if (data.session) {
          setMessage("Account created! Redirecting...");

          // New users are customers, but check role just in case (future-proof)
          setTimeout(async () => {
            try {
              const supabase = createAuthClientBrowser();
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
        } else {
          setMessage("Success! Please check your email to verify your account.");
          setFormData({ name: "", email: "", phone: "", password: "" });
        }
      }
    } catch {
      setMessage("Error: Unable to create account. Please try again.");
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
                <User className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold mb-3 text-gray-900">Create Account</h1>
              <p className="text-gray-600">Join Spice Grille and start earning delicious rewards.</p>
              {message && (
                <div className={cn(
                  "mt-4 p-3 rounded-xl text-sm font-bold",
                  message.includes("Error") ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                )}>
                  {message}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900 placeholder:text-gray-400"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900 placeholder:text-gray-400"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    required
                    placeholder="(555) 123-4567"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900 placeholder:text-gray-400"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                >
                  {isLoading ? "Creating..." : <>Create Account <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs font-bold uppercase">
                <span className="bg-white px-4 text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                const { error } = await signInWithGoogle();
                if (error) setMessage("Error: " + error.message);
                setIsLoading(false);
              }}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="mt-8 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-red-600 hover:text-red-700 transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}