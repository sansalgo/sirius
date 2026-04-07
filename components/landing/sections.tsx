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
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Shared animation helpers
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
      {children}
    </span>
  );
}

function SectionHeading({
  badge,
  title,
  description,
}: {
  badge: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-2xl"
    >
      <SectionBadge>{badge}</SectionBadge>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-zinc-500">{description}</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

const stats = [
  { value: "10 min", label: "Average setup time" },
  { value: "3 roles", label: "Admin, Manager, Employee" },
  { value: "$0", label: "To get started" },
  { value: "100%", label: "Audit trail for every action" },
];

export function StatsBar() {
  return (
    <section className="border-y border-zinc-100 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100 md:grid-cols-4 md:divide-y-0">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center gap-1 px-6 py-8 text-center"
            >
              <span className="text-2xl font-bold text-zinc-900">{stat.value}</span>
              <span className="text-sm text-zinc-500">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features = [
  {
    icon: Handshake,
    title: "Structured peer recognition",
    description:
      "Give teams a governed way to send peer recognition without losing flexibility or culture fit.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: BanknoteArrowUp,
    title: "Controlled point budgets",
    description:
      "Configure manager and peer allocation limits so reward programs stay fair and predictable at every scale.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Gift,
    title: "Reward redemption workflows",
    description:
      "Publish redeemable rewards, track requests, and give finance full visibility into point liabilities.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Sparkles,
    title: "Challenge-based engagement",
    description:
      "Launch repeatable challenges that reinforce behavior, collect evidence, and automate point awards.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Operational visibility",
    description:
      "Live leaderboards and activity data show adoption, momentum, and recognition coverage at a glance.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: ShieldCheck,
    title: "Role-aware administration",
    description:
      "Separate admin, manager, and employee responsibilities with permission-aware workflows that scale.",
    color: "bg-zinc-100 text-zinc-600",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          badge="Core capabilities"
          title="Everything you need to run recognition with discipline."
          description="Sirius combines recognition delivery, budget enforcement, rewards, and engagement programs in one workspace — built for admins, managers, and employees alike."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative flex flex-col gap-5 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex size-11 items-center justify-center rounded-xl ${feature.color}`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How it works (3-step)
// ---------------------------------------------------------------------------

const steps = [
  {
    step: "01",
    icon: Zap,
    title: "Set up your workspace",
    description:
      "Create your company workspace, configure point budgets and allocation rules, and define what behaviors you want to reward.",
  },
  {
    step: "02",
    icon: Users,
    title: "Invite your team",
    description:
      "Add employees by role — admin, manager, or employee. Each role gets the right set of permissions automatically.",
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
    <section className="bg-zinc-950 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400">
            How it works
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Up and running in minutes.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-400">
            No lengthy implementations. Sirius is designed to go from signup to
            first recognition in under ten minutes.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                className="relative flex flex-col gap-5"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[calc(100%+1rem)] top-5 hidden h-px w-8 bg-white/10 md:block" />
                )}
                <div className="flex items-center gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                    <Icon className="size-5 text-white" />
                  </div>
                  <span className="text-xs font-medium tabular-nums text-zinc-600">
                    {step.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </div>
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
    role: "For People teams",
    headline: "Turn recognition into an operating system, not a side initiative.",
    body: "Sirius centralizes recognition, budgets, rewards, and participation so programs stay credible as headcount grows.",
    checks: ["Policy-enforced budgets", "Approval workflows", "Full audit trail"],
  },
  {
    role: "For Managers",
    headline: "Reward the right behavior without manual reconciliation.",
    body: "Managers can allocate points, review challenges, and reinforce performance in one accountable workflow.",
    checks: ["Peer allocation controls", "Challenge review queue", "Team activity view"],
  },
  {
    role: "For Leadership",
    headline: "See whether culture programs are actually driving action.",
    body: "Track who is recognizing, who is being recognized, and where engagement is building across the organization.",
    checks: ["Live leaderboards", "Monthly activity data", "Participation coverage"],
  },
];

export function Outcomes() {
  return (
    <section className="bg-zinc-50 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          badge="Built for every role"
          title="One platform that works for the whole org."
          description="Sirius gives each stakeholder exactly what they need — and nothing they don't."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {outcomes.map((outcome, i) => (
            <motion.div
              key={outcome.role}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
              className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {outcome.role}
              </span>
              <h3 className="text-lg font-semibold leading-snug text-zinc-900">
                {outcome.headline}
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-zinc-500">{outcome.body}</p>
              <ul className="space-y-2">
                {outcome.checks.map((c) => (
                  <li key={c} className="flex items-center gap-2.5 text-sm text-zinc-700">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
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
    cadence: "per month",
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
    <section id="pricing" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          badge="Pricing"
          title="Simple pricing. No surprises."
          description="Start free for smaller teams. Move to a flat paid tier when you need unlimited access across the company."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:max-w-3xl">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`relative flex flex-col gap-6 rounded-2xl p-8 ${
                tier.featured
                  ? "bg-zinc-950 text-white shadow-2xl ring-1 ring-zinc-900"
                  : "border border-zinc-200 bg-white"
              }`}
            >
              {tier.featured && (
                <span className="absolute right-6 top-6 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-300">
                  Recommended
                </span>
              )}

              <div>
                <p
                  className={`text-sm font-semibold ${
                    tier.featured ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  {tier.name}
                </p>
                <div className="mt-2 flex items-end gap-1.5">
                  <span
                    className={`text-5xl font-bold tracking-tight ${
                      tier.featured ? "text-white" : "text-zinc-900"
                    }`}
                  >
                    {tier.price}
                  </span>
                  <span
                    className={`mb-1.5 text-sm ${
                      tier.featured ? "text-zinc-400" : "text-zinc-500"
                    }`}
                  >
                    {tier.cadence}
                  </span>
                </div>
                <p
                  className={`mt-2 text-sm ${
                    tier.featured ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  {tier.description}
                </p>
              </div>

              <div
                className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  tier.featured ? "bg-white/5 text-zinc-300" : "bg-zinc-50 text-zinc-600"
                }`}
              >
                {tier.seats}
              </div>

              <ul className="flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <BadgeCheck
                      className={`size-4 shrink-0 ${
                        tier.featured ? "text-emerald-400" : "text-emerald-500"
                      }`}
                    />
                    <span className={tier.featured ? "text-zinc-300" : "text-zinc-600"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={
                  tier.featured
                    ? "w-full bg-white text-zinc-950 hover:bg-zinc-100 font-semibold"
                    : "w-full"
                }
                variant={tier.featured ? "default" : "outline"}
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
    <section className="bg-zinc-950 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-8 text-center"
        >
          <div className="max-w-2xl space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Give every recognition decision
              <br />a system behind it.
            </h2>
            <p className="text-lg leading-relaxed text-zinc-400">
              Start with 10 users for free. Roll out recognition with guardrails.
              Expand when your team is ready.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="gap-2 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold"
            >
              <Link href="/signup">
                Start free — no credit card
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <Link href="/login">Sign in to your workspace</Link>
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
    <footer className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900">
                <BadgeCheck className="size-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-zinc-900">Sirius</span>
            </div>
            <p className="max-w-xs text-sm text-zinc-500">
              Recognition operations for modern teams.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Product
              </p>
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Account
              </p>
              {[
                { label: "Log in", href: "/login" },
                { label: "Sign up", href: "/signup" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-100 pt-8 text-center text-xs text-zinc-400">
          © {new Date().getFullYear()} Sirius. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
