"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  BanknoteArrowUp,
  ChartNoAxesCombined,
  Gift,
  Handshake,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  BarChart3,
  Check,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Shared animation helpers
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

const stats = [
  { value: "10 min", label: "Average setup time" },
  { value: "3 roles", label: "Admin · Manager · Employee" },
  { value: "$0", label: "To get started" },
  { value: "100%", label: "Audit trail on every action" },
];

export function StatsBar() {
  return (
    <section className="border-b border-zinc-100">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100 md:grid-cols-4 md:divide-y-0">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
              className="flex flex-col gap-0.5 px-6 py-7 text-center"
            >
              <span className="text-2xl font-bold tracking-tight text-zinc-900">
                {stat.value}
              </span>
              <span className="text-xs text-zinc-400">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Features — Next.js-style grid with internal dividers
// ---------------------------------------------------------------------------

const features = [
  {
    icon: Handshake,
    title: "Structured peer recognition",
    description:
      "Give teams a governed way to send peer recognition without losing flexibility or culture fit.",
  },
  {
    icon: BanknoteArrowUp,
    title: "Controlled point budgets",
    description:
      "Configure manager and peer allocation limits so reward programs stay fair and predictable at every scale.",
  },
  {
    icon: Gift,
    title: "Reward redemption",
    description:
      "Publish redeemable rewards, track requests, and give finance full visibility into point liabilities.",
  },
  {
    icon: Sparkles,
    title: "Challenge-based engagement",
    description:
      "Launch repeatable challenges that reinforce behavior, collect evidence, and automate point awards.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Live leaderboards",
    description:
      "Activity data shows adoption, momentum, and recognition coverage at a glance across your org.",
  },
  {
    icon: ShieldCheck,
    title: "Role-aware administration",
    description:
      "Separate admin, manager, and employee responsibilities with permission-aware workflows that scale.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-16"
        >
          <p className="mb-3 text-sm font-medium text-zinc-400">Platform</p>
          <h2 className="max-w-xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            What&apos;s in Sirius?
          </h2>
        </motion.div>

        {/* Feature grid with internal dividers */}
        <div className="border-t border-l border-zinc-100">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: i * 0.06, duration: 0.45, ease: "easeOut" }}
                  className="group border-b border-r border-zinc-100 p-8 transition-colors hover:bg-zinc-50"
                >
                  <div className="mb-5 inline-flex size-9 items-center justify-center rounded-lg border border-zinc-100 bg-white">
                    <Icon className="size-4 text-zinc-700" />
                  </div>
                  <h3 className="mb-2 font-semibold text-zinc-900">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

const steps = [
  {
    step: "01",
    icon: Zap,
    title: "Set up your workspace",
    description:
      "Configure point budgets, allocation rules, and define what behaviors you want to reward — in minutes.",
  },
  {
    step: "02",
    icon: Users,
    title: "Invite your team",
    description:
      "Add employees by role. Admin, manager, or employee — each gets the right permissions automatically.",
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Watch engagement grow",
    description:
      "Track recognitions, redemptions, and challenge participation through live leaderboards and activity feeds.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-zinc-100 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="mb-3 text-sm font-medium text-zinc-400">Get started</p>
          <h2 className="max-w-xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Up and running in minutes.
          </h2>
        </motion.div>

        <div className="grid gap-0 border-t border-l border-zinc-100 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.1, duration: 0.45, ease: "easeOut" }}
                className="border-b border-r border-zinc-100 p-8"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-100 bg-white">
                    <Icon className="size-4 text-zinc-700" />
                  </div>
                  <span className="font-mono text-2xl font-bold text-zinc-100">
                    {step.step}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold text-zinc-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Outcomes (personas)
// ---------------------------------------------------------------------------

const outcomes = [
  {
    role: "People teams",
    headline: "Turn recognition into an operating system.",
    body: "Centralize recognition, budgets, rewards, and participation so programs stay credible as headcount grows.",
    checks: ["Policy-enforced budgets", "Approval workflows", "Full audit trail"],
  },
  {
    role: "Managers",
    headline: "Reward the right behavior without reconciliation.",
    body: "Allocate points, review challenges, and reinforce performance in one accountable workflow.",
    checks: ["Peer allocation controls", "Challenge review queue", "Team activity view"],
  },
  {
    role: "Leadership",
    headline: "See whether culture programs drive action.",
    body: "Track who is recognizing, who is being recognized, and where engagement is growing.",
    checks: ["Live leaderboards", "Monthly activity data", "Participation coverage"],
  },
];

export function Outcomes() {
  return (
    <section className="border-t border-zinc-100 bg-zinc-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="mb-3 text-sm font-medium text-zinc-400">Built for every role</p>
          <h2 className="max-w-xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            One platform that works for the whole org.
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {outcomes.map((outcome, i) => (
            <motion.div
              key={outcome.role}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: i * 0.1, duration: 0.45, ease: "easeOut" }}
              className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-7"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                {outcome.role}
              </p>
              <h3 className="text-base font-semibold leading-snug text-zinc-900">
                {outcome.headline}
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-zinc-500">{outcome.body}</p>
              <ul className="space-y-2 border-t border-zinc-100 pt-4">
                {outcome.checks.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-zinc-600">
                    <Check className="size-3.5 shrink-0 text-zinc-400" strokeWidth={2.5} />
                    {c}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

const tiers = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "For early teams validating a recognition program.",
    seats: "Up to 10 seats",
    features: [
      "Peer recognition and points",
      "Reward catalog and redemptions",
      "Challenge tracking",
      "Admin, manager, and employee roles",
    ],
    cta: "Start free",
    href: "/signup",
    featured: false,
  },
  {
    name: "Pro",
    price: "$2",
    cadence: "per seat / month",
    description: "For companies rolling out recognition at full scale.",
    seats: "Unlimited seats",
    features: [
      "Everything in Free",
      "Unlimited employee seats",
      "Flat monthly pricing",
      "Priority support",
    ],
    cta: "Get started",
    href: "/signup",
    featured: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-zinc-100 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-sm font-medium text-zinc-400">Pricing</p>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Simple pricing. No surprises.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-zinc-500">
            Start free for smaller teams. Upgrade when you need unlimited access
            across the company.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="mx-auto grid max-w-2xl gap-4 lg:grid-cols-2">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45, ease: "easeOut" }}
              className={`relative flex flex-col gap-6 rounded-xl p-8 ${
                tier.featured
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white"
              }`}
            >
              {tier.featured && (
                <span className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                  Recommended
                </span>
              )}

              <div>
                <p className={`text-sm font-medium ${tier.featured ? "text-zinc-400" : "text-zinc-500"}`}>
                  {tier.name}
                </p>
                <div className="mt-2 flex items-end gap-1.5">
                  <span className={`text-5xl font-bold tracking-tight ${tier.featured ? "text-white" : "text-zinc-900"}`}>
                    {tier.price}
                  </span>
                  <span className={`mb-1.5 text-sm ${tier.featured ? "text-zinc-500" : "text-zinc-400"}`}>
                    {tier.cadence}
                  </span>
                </div>
                <p className={`mt-1.5 text-sm ${tier.featured ? "text-zinc-400" : "text-zinc-500"}`}>
                  {tier.description}
                </p>
              </div>

              <div className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
                tier.featured
                  ? "border border-white/10 bg-white/5 text-zinc-300"
                  : "border border-zinc-100 bg-zinc-50 text-zinc-600"
              }`}>
                {tier.seats}
              </div>

              <ul className="flex-1 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <BadgeCheck className={`size-4 shrink-0 ${tier.featured ? "text-white" : "text-zinc-700"}`} />
                    <span className={tier.featured ? "text-zinc-300" : "text-zinc-600"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={
                  tier.featured
                    ? "w-full bg-white text-zinc-900 hover:bg-zinc-100 font-medium"
                    : "w-full bg-zinc-900 text-white hover:bg-zinc-700 font-medium"
                }
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------

export function CTASection() {
  return (
    <section className="bg-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between"
        >
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Give every recognition decision a system behind it.
            </h2>
            <p className="mt-4 text-zinc-400">
              Start with 10 users for free. Expand when your team is ready.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="gap-2 bg-white text-zinc-900 hover:bg-zinc-100 font-medium"
            >
              <Link href="/signup">
                Start free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-white">
                <Star className="size-3.5 fill-black text-zinc-900" />
              </div>
              <span className="text-sm font-semibold text-white">Sirius</span>
            </div>
            <p className="mt-2 max-w-xs text-sm text-zinc-500">
              Recognition operations for modern teams.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Product
              </p>
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="text-sm text-zinc-500 transition-colors hover:text-white"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Account
              </p>
              {[
                { label: "Log in", href: "/login" },
                { label: "Sign up", href: "/signup" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-sm text-zinc-500 transition-colors hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-800 pt-8 text-xs text-zinc-600">
          © {new Date().getFullYear()} Sirius. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
