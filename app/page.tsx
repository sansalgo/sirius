import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BanknoteArrowUp,
  ChartNoAxesCombined,
  Gift,
  Handshake,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";

const painPoints = [
  "Recognition happens inconsistently, so impact is invisible and morale drops.",
  "Point budgets, reward approvals, and employee access get managed in spreadsheets.",
  "Leadership cannot prove whether recognition programs are actually changing behavior.",
];

const featureHighlights = [
  {
    icon: Handshake,
    title: "Structured recognition",
    description:
      "Give teams a governed way to send peer recognition without losing flexibility or culture.",
  },
  {
    icon: BanknoteArrowUp,
    title: "Controlled point budgets",
    description:
      "Configure manager and peer allocation limits so reward programs stay fair and predictable.",
  },
  {
    icon: Gift,
    title: "Reward redemption workflows",
    description:
      "Publish redeemable rewards, track requests, and keep finance-friendly visibility into point liabilities.",
  },
  {
    icon: Sparkles,
    title: "Challenge-based engagement",
    description:
      "Launch repeatable challenges that reinforce behavior, collect evidence, and automate awards.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Operational visibility",
    description:
      "Use live leaderboards and activity data to understand adoption, momentum, and recognition coverage.",
  },
  {
    icon: ShieldCheck,
    title: "Role-aware administration",
    description:
      "Separate admin, manager, and employee responsibilities with permission-aware workflows.",
  },
];

const outcomes = [
  {
    label: "For People teams",
    title: "Turn recognition into an operating system, not a side initiative.",
    description:
      "Sirius centralizes recognition, budgets, rewards, and participation so programs stay credible as headcount grows.",
  },
  {
    label: "For managers",
    title: "Reward the right behavior without manual reconciliation.",
    description:
      "Managers can allocate points, review challenges, and reinforce performance in one accountable workflow.",
  },
  {
    label: "For leadership",
    title: "See whether culture programs are driving action.",
    description:
      "Track who is recognizing, who is being recognized, and where engagement is building across the organization.",
  },
];

const pricingTiers = [
  {
    name: "Free",
    headline: "For early teams validating a recognition program",
    price: "$0",
    cadence: "per month",
    userRange: "Up to 10 users included",
    features: [
      "Peer recognition and points",
      "Reward catalog and redemption requests",
      "Challenge tracking",
      "Admin, manager, and employee roles",
    ],
    cta: "Start free",
    href: "/signup",
    featured: false,
  },
  {
    name: "Pro",
    headline: "For companies rolling out recognition without headcount limits",
    price: "$2",
    cadence: "per month",
    userRange: "Unlimited users",
    features: [
      "Everything in Free",
      "Unlimited employee seats",
      "Flat monthly pricing",
      "Best fit for multi-team rollouts",
    ],
    cta: "Create workspace",
    href: "/signup",
    featured: true,
  },
];

export default async function Home() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (session?.session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-gradient-to-b from-muted via-background to-background" />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 lg:px-10">
        <header className="flex items-center justify-between border-b py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Star />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium tracking-[0.24em] text-muted-foreground">
                SIRIUS
              </span>
              <span className="text-sm text-muted-foreground">
                Recognition operations for modern teams
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                Start free
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <Badge variant="secondary" className="w-fit">
                Employee recognition, rewards, and challenges
              </Badge>
              <div className="flex flex-col gap-6">
                <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
                  Build a recognition program people trust, not one HR has to chase.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  Sirius gives growing companies a single system for peer recognition,
                  governed point budgets, reward redemption, and challenge-based engagement.
                  Replace spreadsheets and ad hoc approvals with an operating model that scales.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Create your workspace
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in to Sirius</Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardDescription>Recognition velocity</CardDescription>
                  <CardTitle>Peer-to-peer appreciation with policy controls</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Reward accountability</CardDescription>
                  <CardTitle>Redemptions tracked against real point balances</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Behavior change</CardDescription>
                  <CardTitle>Challenges that tie culture goals to measurable actions</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>

          <Card className="border-primary/15 bg-card/80 shadow-lg backdrop-blur">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Why teams buy Sirius
              </Badge>
              <CardTitle className="text-2xl">
                Recognition programs fail when the process is invisible.
              </CardTitle>
              <CardDescription className="text-base leading-7">
                Sirius creates one operational layer for participation, budgets, rewards,
                and approvals so every recognition action is visible and auditable.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {painPoints.map((painPoint) => (
                <div key={painPoint} className="flex items-start gap-3 rounded-lg border bg-background/70 p-4">
                  <BadgeCheck className="mt-0.5 size-5 text-primary" />
                  <p className="text-sm leading-6 text-muted-foreground">{painPoint}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-8 border-t py-16">
          <div className="max-w-3xl">
            <Badge variant="secondary">Problem to solution</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Sirius turns fragmented recognition workflows into a governed growth loop.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Instead of disconnected recognition messages, manual point tracking, and opaque
              approvals, Sirius gives every team one system to reward the behaviors they want to
              repeat.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {outcomes.map((outcome) => (
              <Card key={outcome.title} className="h-full">
                <CardHeader>
                  <Badge variant="outline" className="w-fit">
                    {outcome.label}
                  </Badge>
                  <CardTitle className="text-xl">{outcome.title}</CardTitle>
                  <CardDescription className="text-base leading-7">
                    {outcome.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-8 border-t py-16">
          <div className="max-w-3xl">
            <Badge variant="secondary">Core capabilities</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything needed to run recognition with operational discipline.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Sirius combines recognition delivery, budget enforcement, rewards, and
              engagement programs in a single workspace built for admins, managers, and employees.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureHighlights.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card key={feature.title} className="h-full">
                  <CardHeader className="gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base leading-7">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-8 border-t py-16">
          <div className="max-w-3xl">
            <Badge variant="secondary">Pricing</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Choose the plan that matches your team size and rollout stage.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Sirius keeps pricing simple: start free for smaller teams, or move to a flat paid
              tier when you need unlimited access across the company.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={tier.featured ? "border-primary shadow-lg" : undefined}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                      <CardDescription className="mt-2 text-base leading-7">
                        {tier.headline}
                      </CardDescription>
                    </div>
                    {tier.featured ? <Badge>Recommended</Badge> : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-semibold tracking-tight">{tier.price}</span>
                    <span className="pb-1 text-sm text-muted-foreground">{tier.cadence}</span>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                    {tier.userRange}
                  </div>
                  <div className="flex flex-col gap-3">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <BadgeCheck className="mt-0.5 size-5 text-primary" />
                        <span className="text-sm leading-6 text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant={tier.featured ? "default" : "outline"} asChild>
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-muted/40">
            <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 size-5 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">Plan guidance</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Use Free for teams with up to 10 users. Upgrade to Pro for unlimited users at
                    a flat $2/month.
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href="/signup">Launch your first 10 seats free</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="py-16">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-muted to-background">
            <CardContent className="flex flex-col gap-8 py-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Badge variant="secondary">Ready to launch</Badge>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Give every recognition decision a system behind it.
                </h2>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">
                  Start with 10 users for free, roll out recognition with guardrails, and expand
                  when your team is ready.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Start free
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
