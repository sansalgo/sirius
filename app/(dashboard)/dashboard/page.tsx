import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  Clock,
  Zap,
  Star,
  Wallet,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeRole } from "@/lib/rbac";
import { getOnboardingState } from "@/actions/onboarding";
import { OnboardingChecklistWrapper } from "@/components/onboarding-checklist-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getCurrentMonthRange() {
  const now = new Date();
  return {
    now,
    periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
    periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    monthLabel: now.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    }),
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function TopEarners({
  entries,
  currentUserId,
}: {
  entries: { userId: string; name: string; value: number }[];
  currentUserId: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">Rank</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead className="text-right">Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center text-muted-foreground h-24"
            >
              No activity yet this month.
            </TableCell>
          </TableRow>
        ) : (
          entries.map((entry, i) => {
            const rank = i + 1;
            const isCurrentUser = entry.userId === currentUserId;
            const badgeVariant =
              rank === 1 ? "default" : rank <= 3 ? "secondary" : "outline";
            return (
              <TableRow
                key={entry.userId}
                className={isCurrentUser ? "bg-muted/40" : undefined}
              >
                <TableCell>
                  <Badge variant={badgeVariant}>#{rank}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {entry.name}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {entry.value}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

async function buildEmployeeLeaderboard(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const [employees, ledgerEntries] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId, status: "ACTIVE", role: "EMPLOYEE" },
      select: { id: true, name: true },
    }),
    prisma.pointLedger.findMany({
      where: {
        tenantId,
        amount: { gt: 0 },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { toUserId: true, amount: true },
    }),
  ]);

  const employeeIds = new Set(employees.map((u) => u.id));
  const employeeById = new Map(employees.map((u) => [u.id, u.name]));

  const totals = new Map<string, number>();
  for (const entry of ledgerEntries) {
    if (!employeeIds.has(entry.toUserId)) continue;
    totals.set(entry.toUserId, (totals.get(entry.toUserId) ?? 0) + entry.amount);
  }

  return Array.from(totals.entries())
    .map(([userId, value]) => ({
      userId,
      name: employeeById.get(userId) ?? "",
      value,
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, 5);
}

export default async function Page() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session?.user?.id) redirect("/login");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, tenantId: true, name: true, role: true },
  });
  if (!currentUser?.tenantId) redirect("/login");

  const role = normalizeRole(currentUser.role);
  const tenantId = currentUser.tenantId;
  const { now, periodStart, periodEnd, monthLabel } = getCurrentMonthRange();

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  if (role === "ADMIN") {
    const [
      activeEmployeeCount,
      pointsAggregate,
      pendingRedemptions,
      activeChallenges,
      onboarding,
      topEarners,
    ] = await Promise.all([
      prisma.user.count({
        where: { tenantId, status: "ACTIVE", role: "EMPLOYEE" },
      }),
      prisma.pointLedger.aggregate({
        where: {
          tenantId,
          amount: { gt: 0 },
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        _sum: { amount: true },
      }),
      prisma.rewardRedemption.count({ where: { tenantId, status: "PENDING" } }),
      prisma.challenge.count({ where: { tenantId, isActive: true } }),
      getOnboardingState(tenantId),
      buildEmployeeLeaderboard(tenantId, periodStart, periodEnd),
    ]);

    const pointsDistributed = pointsAggregate._sum.amount ?? 0;

    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground text-sm">
              Organization overview for {monthLabel}
            </p>
          </div>
          {pendingRedemptions > 0 && (
            <Link href="/redemptions">
              <Button size="sm">
                Review {pendingRedemptions} redemption
                {pendingRedemptions !== 1 ? "s" : ""}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {onboarding && !onboarding.dismissed && (
          <OnboardingChecklistWrapper steps={onboarding.steps} />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Active Employees"
            value={activeEmployeeCount}
            sub="currently active"
          />
          <StatCard
            icon={TrendingUp}
            label="Points Distributed"
            value={pointsDistributed.toLocaleString()}
            sub="this month"
          />
          <StatCard
            icon={Clock}
            label="Pending Redemptions"
            value={pendingRedemptions}
            sub={pendingRedemptions > 0 ? "awaiting review" : "all clear"}
          />
          <StatCard
            icon={Zap}
            label="Active Challenges"
            value={activeChallenges}
            sub="open for submission"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Earners</CardTitle>
            <CardDescription>
              Employees who received the most points this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopEarners entries={topEarners} currentUserId={currentUser.id} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── MANAGER ────────────────────────────────────────────────────────────────
  if (role === "MANAGER") {
    const [
      activeEmployeeCount,
      pendingRedemptions,
      activeChallenges,
      managerAllocation,
      topEarners,
    ] = await Promise.all([
      prisma.user.count({
        where: { tenantId, status: "ACTIVE", role: "EMPLOYEE" },
      }),
      prisma.rewardRedemption.count({ where: { tenantId, status: "PENDING" } }),
      prisma.challenge.count({ where: { tenantId, isActive: true } }),
      prisma.managerAllocation.findFirst({
        where: {
          tenantId,
          managerId: currentUser.id,
          periodStart: { lte: now },
          periodEnd: { gt: now },
        },
        select: { allocationLimit: true, usedAmount: true },
      }),
      buildEmployeeLeaderboard(tenantId, periodStart, periodEnd),
    ]);

    const allocationUsed = managerAllocation?.usedAmount ?? 0;
    const allocationLimit = managerAllocation?.allocationLimit ?? 0;
    const allocationRemaining = Math.max(0, allocationLimit - allocationUsed);

    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground text-sm">
              Team overview for {monthLabel}
            </p>
          </div>
          {pendingRedemptions > 0 && (
            <Link href="/redemptions">
              <Button size="sm">
                Review {pendingRedemptions} redemption
                {pendingRedemptions !== 1 ? "s" : ""}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Active Employees"
            value={activeEmployeeCount}
            sub="currently active"
          />
          <StatCard
            icon={TrendingUp}
            label="Budget Used"
            value={allocationUsed.toLocaleString()}
            sub={
              allocationLimit > 0
                ? `of ${allocationLimit.toLocaleString()} pts`
                : "no budget set"
            }
          />
          <StatCard
            icon={Wallet}
            label="Budget Remaining"
            value={allocationRemaining.toLocaleString()}
            sub="available to allocate"
          />
          <StatCard
            icon={Clock}
            label="Pending Redemptions"
            value={pendingRedemptions}
            sub={pendingRedemptions > 0 ? "awaiting review" : "all clear"}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Earners</CardTitle>
                <CardDescription>
                  Employees who received the most points this month.
                </CardDescription>
              </div>
              <Link href="/points">
                <Button variant="outline" size="sm">
                  Allocate Points
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <TopEarners entries={topEarners} currentUserId={currentUser.id} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── EMPLOYEE ───────────────────────────────────────────────────────────────
  const [
    myWallet,
    myEarnedAggregate,
    myRecognitionCount,
    employeeWallets,
    topEarners,
  ] = await Promise.all([
    prisma.wallet.findUnique({
      where: { tenantId_userId: { tenantId, userId: currentUser.id } },
      select: { totalPoints: true, reservedPoints: true },
    }),
    prisma.pointLedger.aggregate({
      where: {
        tenantId,
        toUserId: currentUser.id,
        amount: { gt: 0 },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      _sum: { amount: true },
    }),
    prisma.pointLedger.count({
      where: {
        tenantId,
        toUserId: currentUser.id,
        type: "PEER",
        createdAt: { gte: periodStart, lt: periodEnd },
      },
    }),
    prisma.wallet.findMany({
      where: { tenantId, user: { role: "EMPLOYEE", status: "ACTIVE" } },
      select: { userId: true, totalPoints: true, reservedPoints: true },
    }),
    buildEmployeeLeaderboard(tenantId, periodStart, periodEnd),
  ]);

  const myAvailable = myWallet
    ? myWallet.totalPoints - myWallet.reservedPoints
    : 0;
  const myEarnedThisMonth = myEarnedAggregate._sum.amount ?? 0;

  const sortedWallets = employeeWallets
    .map((w) => ({
      userId: w.userId,
      available: w.totalPoints - w.reservedPoints,
    }))
    .sort((a, b) => b.available - a.available);
  const myRankIndex = sortedWallets.findIndex(
    (w) => w.userId === currentUser.id
  );
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Your snapshot for {monthLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/recognition">
            <Button variant="outline" size="sm">
              Send Recognition
            </Button>
          </Link>
          <Link href="/rewards">
            <Button size="sm">Browse Rewards</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Available Balance"
          value={myAvailable.toLocaleString()}
          sub="points to spend"
        />
        <StatCard
          icon={TrendingUp}
          label="Earned This Month"
          value={myEarnedThisMonth.toLocaleString()}
          sub="points received"
        />
        <StatCard
          icon={Star}
          label="Recognitions Received"
          value={myRecognitionCount}
          sub="peer recognitions this month"
        />
        <StatCard
          icon={Trophy}
          label="Balance Rank"
          value={myRank ? `#${myRank}` : "—"}
          sub={`among ${sortedWallets.length} employees`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Earners</CardTitle>
          <CardDescription>
            Employees who received the most points this month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopEarners entries={topEarners} currentUserId={currentUser.id} />
        </CardContent>
      </Card>
    </div>
  );
}
