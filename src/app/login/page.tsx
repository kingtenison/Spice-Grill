"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

const foodImages = [
  "/Waakye.jpg",
  "/Tilapia.jpg",
  "/Pounded%20_Yam%20and%20Egusi.jpg",
  "/Fried_Rice.png",
  "/Fried%20Yam%20and%20Fish.jpg",
  "/Fried_chicken.jpg",
  "/Mango_Drink.jpg",
  "/Pineapple_Drink.png",
  "/Strawberry_Drink.jpg",
  "/Kenkey+with+Pepper-+Sheeda%20Travel%20Tribe.png",
];

function Particles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: (i * 0.312 + 2) % 8 + 2,
      x: (i * 4.937) % 100,
      delay: (i * 0.421) % 8,
      duration: (i * 0.619) % 6 + 6,
    })),
  []);
  if (!mounted) return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0
              ? "rgba(220, 38, 38, 0.25)"
              : p.id % 3 === 1
                ? "rgba(251, 146, 60, 0.2)"
                : "rgba(251, 191, 36, 0.15)",
            animation: `login-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function LoadingScreen() {
  const [imgIndex, setImgIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setImgIndex((i) => (i + 1) % foodImages.length), 4000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white">
      {foodImages.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url(${src})`, opacity: i === imgIndex ? 0.5 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/60 to-orange-50/70" />
      <Particles />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center"
      >
        <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden shadow-lg shadow-red-200">
          <img src="/Spice_Logo.jpg" alt="The Spice Grille" className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: "0s" }} />
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
        </div>
      </motion.div>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.98,
  },
};

export default function LoginPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const timer = setInterval(() => setImgIndex((i) => (i + 1) % foodImages.length), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            if (data.role === "admin") {
              window.location.href = "/admin";
            } else if (data.role === "employee") {
              window.location.href = "/employee";
            } else if (data.isApprovedDispatcher) {
              window.location.href = "/dispatcher";
            } else {
              window.location.href = "/menu";
            }
            return;
          }
        }
      } catch {
        // not authenticated
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  if (checkingSession) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Full-bleed food background */}
      {foodImages.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${src})`,
            opacity: mounted ? (i === imgIndex ? 1 : 0) : (i === 0 ? 1 : 0),
            transition: i === imgIndex ? "opacity 1s ease-in-out" : "opacity 1s ease-in-out",
          }}
        />
      ))}

      {/* Overlay to keep card readable */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 z-[1]" />

      <Particles />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 w-full max-w-sm"
      >
        <motion.div
          variants={childVariants}
          className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 md:p-10 text-center shadow-2xl shadow-black/20"
        >
          <motion.div
            variants={childVariants}
            className="w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden ring-2 ring-white/80 shadow-lg"
          >
            <img src="/Spice_Logo.jpg" alt="The Spice Grille" className="w-full h-full object-cover" />
          </motion.div>

          <motion.h1
            variants={childVariants}
            className="text-3xl font-bold mb-2 text-gray-900 font-display tracking-wide"
          >
            Welcome Back
          </motion.h1>

          <motion.p
            variants={childVariants}
            className="text-sm mb-10 text-gray-400 font-sans font-normal tracking-wide"
          >
            Sign in to track your orders & earn rewards
          </motion.p>

          <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
            <a
              href="/api/auth/google"
              className="group relative w-full inline-flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700 shadow-sm border border-gray-200 hover:border-gray-300"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-[15px] font-semibold tracking-tight">Continue with Google</span>
            </a>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 text-center text-xs text-white/60 font-sans tracking-wider uppercase"
        >
          The Spice Grille &mdash; Afro-Caribbean Cuisine
        </motion.p>
      </motion.div>
    </div>
  );
}
