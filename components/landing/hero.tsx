"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Star, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Animated product preview cards
// ---------------------------------------------------------------------------

function RecognitionCard() {
  return (
    <motion.div
      className="w-72 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm ring-1 ring-white/5 shadow-2xl"
      initial={{ opacity: 0, x: 40, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-zinc-400">
        <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
        New recognition
      </div>
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-300">
          S
        </div>
        <div className="min-w-0">
          <p className="text-xs text-zinc-400">
            <span className="font-semibold text-white">Sarah K.</span> recognized{" "}
            <span className="font-semibold text-white">Marcus T.</span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-300">
            &ldquo;Crushed the Q2 product demo. Our best yet.&rdquo;
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              +50 pts
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500">
              Leadership
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LeaderboardCard() {
  const entries = [
    { name: "Marcus T.", pts: 340, rank: 1 },
    { name: "Sarah K.", pts: 280, rank: 2 },
    { name: "Alex R.", pts: 195, rank: 3 },
  ];

  return (
    <motion.div
      className="w-64 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm ring-1 ring-white/5 shadow-2xl"
      initial={{ opacity: 0, x: 40, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-white">Leaderboard</p>
        <span className="text-[10px] text-zinc-500">April</span>
      </div>
      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.rank} className="flex items-center gap-2.5">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                e.rank === 1
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-white/5 text-zinc-500"
              }`}
            >
              {e.rank}
            </span>
            <span className="flex-1 truncate text-xs text-zinc-300">{e.name}</span>
            <span className="text-xs font-medium tabular-nums text-white">{e.pts}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function StatsCard() {
  return (
    <motion.div
      className="w-56 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm ring-1 ring-white/5 shadow-2xl"
      initial={{ opacity: 0, x: 40, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        This month
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-white">24</p>
      <p className="text-xs text-zinc-400">recognitions sent</p>
      <div className="mt-3 flex items-center gap-1.5">
        <TrendingUp className="size-3 text-emerald-400" />
        <span className="text-xs font-medium text-emerald-400">+40%</span>
        <span className="text-xs text-zinc-500">vs last month</span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-950 pt-16">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(120,80,255,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-16 px-6 py-20 lg:flex-row lg:items-center lg:gap-12 lg:px-10">
        {/* Left — copy */}
        <div className="flex max-w-2xl flex-col items-center gap-8 text-center lg:items-start lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5"
          >
            <Award className="size-3.5 text-amber-400" />
            <span className="text-xs font-medium text-zinc-300">
              Employee recognition, rewards &amp; challenges
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
            className="text-5xl font-bold tracking-tight text-white text-balance sm:text-6xl lg:text-7xl"
          >
            Recognition your
            <br />
            <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              team will trust.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="max-w-lg text-lg leading-relaxed text-zinc-400"
          >
            Sirius gives growing companies one workspace for peer recognition,
            governed point budgets, reward redemption, and challenge-based
            engagement — no spreadsheets, no manual approvals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              asChild
              className="gap-2 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold"
            >
              <Link href="/signup">
                Create your workspace
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </motion.div>

          {/* Trust micro-signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 lg:justify-start"
          >
            {[
              "Free for up to 10 seats",
              "No credit card required",
              "10-minute setup",
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <span className="text-xs text-zinc-500">{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — product preview */}
        <div className="relative hidden flex-col gap-4 lg:flex">
          <RecognitionCard />
          <div className="flex gap-4">
            <LeaderboardCard />
            <StatsCard />
          </div>
        </div>
      </div>

      {/* Bottom fade to white */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
