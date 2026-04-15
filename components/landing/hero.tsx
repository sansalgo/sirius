"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="flex min-h-screen flex-col bg-white pt-14">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
        {/* Badge */}
        <motion.a
          href="#features"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
        >
          Employee Recognition Platform
          <ArrowUpRight className="size-3" />
        </motion.a>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55, ease: "easeOut" }}
          className="max-w-3xl text-balance text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl lg:text-[5rem] lg:leading-[1.05]"
        >
          Recognition your team will trust.
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.55, ease: "easeOut" }}
          className="max-w-lg text-lg leading-relaxed text-zinc-500"
        >
          One workspace for peer recognition, governed point budgets, reward
          redemption, and challenge-based engagement. No spreadsheets, no
          manual approvals.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.55, ease: "easeOut" }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Button
            size="lg"
            asChild
            className="gap-2 bg-zinc-900 text-white hover:bg-zinc-700 font-medium px-6"
          >
            <Link href="/signup">
              Get started for free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 px-6"
          >
            <Link href="/login">Sign in to your workspace</Link>
          </Button>
        </motion.div>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5"
        >
          {[
            "Free for up to 10 seats",
            "No credit card required",
            "10-minute setup",
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Check className="size-3 text-zinc-300" strokeWidth={2.5} />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Bottom border */}
      <div className="border-t border-zinc-100" />
    </section>
  );
}
