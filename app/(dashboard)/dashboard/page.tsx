import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
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

type LeaderboardEntry = {
  userId: string;
  name: string;
  email: string;
  value: number;
  secondaryValue?: number;
};

function getCurrentMonthRange() {
  const now = new Date();
  return {
    periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
    periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

function getRankBadgeVariant(rank: number): "default" | "secondary" | "outline" {
  if (rank === 1) return "default";
  if (rank <= 3) return "secondary";
  return "outline";
}

function buildLeaderboard(
  totals: Map<string, number>,
  users: Map<string, { name: string; email: string }>,
  limit = 5,
  secondaryTotals?: Map<string, number>
) {
  return Array.from(totals.entries())
    .flatMap(([userId, value]) => {
      const user = users.get(userId);
      if (!user) {
        return [];
      }

      return [{
        userId,
        name: user.name,
        email: user.email,
        value,
        secondaryValue: secondaryTotals?.get(userId),
      } satisfies LeaderboardEntry];
    })
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function LeaderboardTable({
  entries,
  valueLabel,
  emptyState,
  currentUserId,
  showSecondaryValue = false,
}: {
  entries: LeaderboardEntry[];
  valueLabel: string;
  emptyState: string;
  currentUserId: string;
  showSecondaryValue?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead className="text-right">{valueLabel}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.length ? (
          entries.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.userId === currentUserId;

            return (
              <TableRow key={entry.userId} className={isCurrentUser ? "bg-muted/40" : undefined}>
                <TableCell>
                  <Badge variant={getRankBadgeVariant(rank)}>#{rank}</Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{entry.name}</div>
                  <div className="text-xs text-muted-foreground">{entry.email}</div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {entry.value}
                  {showSecondaryValue && typeof entry.secondaryValue === "number" ? (
                    <div className="text-xs font-normal text-muted-foreground">
                      {entry.secondaryValue} peer sends
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
              {emptyState}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

async function getLeaderboardData() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, tenantId: true, name: true },
  });

  if (!currentUser?.tenantId) {
    redirect("/login");
  }

  const { periodStart, periodEnd } = getCurrentMonthRange();

  const [activeUsers, monthlyIncoming, monthlyPeerSends, wallets] = await Promise.all([
    prisma.user.findMany({
      where: {
        tenantId: currentUser.tenantId,
        status: "ACTIVE",
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.pointLedger.findMany({
      where: {
        tenantId: currentUser.tenantId,
        amount: { gt: 0 },
        createdAt: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
      select: { toUserId: true, amount: true },
    }),
    prisma.pointLedger.findMany({
      where: {
        tenantId: currentUser.tenantId,
        type: "PEER",
        fromUserId: { not: null },
        createdAt: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
      select: { fromUserId: true, amount: true },
    }),
    prisma.wallet.findMany({
      where: {
        tenantId: currentUser.tenantId,
        user: {
          status: "ACTIVE",
        },
      },
      select: {
        userId: true,
        totalPoints: true,
        reservedPoints: true,
      },
    }),
  ]);

  const usersById = new Map(
    activeUsers.map((user) => [user.id, { name: user.name, email: user.email }])
  );

  const earnedTotals = new Map<string, number>();
  for (const ledger of monthlyIncoming) {
    earnedTotals.set(ledger.toUserId, (earnedTotals.get(ledger.toUserId) ?? 0) + ledger.amount);
  }

  const peerSentTotals = new Map<string, number>();
  const peerSendCounts = new Map<string, number>();
  for (const ledger of monthlyPeerSends) {
    if (!ledger.fromUserId) {
      continue;
    }

    peerSentTotals.set(
      ledger.fromUserId,
      (peerSentTotals.get(ledger.fromUserId) ?? 0) + ledger.amount
    );
    peerSendCounts.set(
      ledger.fromUserId,
      (peerSendCounts.get(ledger.fromUserId) ?? 0) + 1
    );
  }

  const balanceEntries = wallets
    .flatMap((wallet) => {
      const user = usersById.get(wallet.userId);
      if (!user) {
        return [];
      }

      return [{
        userId: wallet.userId,
        name: user.name,
        email: user.email,
        value: wallet.totalPoints - wallet.reservedPoints,
      } satisfies LeaderboardEntry];
    })
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, 5);

  const currentUserBalanceRank =
    wallets
      .map((wallet) => ({
        userId: wallet.userId,
        value: wallet.totalPoints - wallet.reservedPoints,
      }))
      .sort((a, b) => b.value - a.value)
      .findIndex((entry) => entry.userId === currentUser.id) + 1;

  return {
    currentUserId: currentUser.id,
    currentUserName: currentUser.name,
    monthLabel: periodStart.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    }),
    totalActiveUsers: activeUsers.length,
    totalPeerRecognitions: monthlyPeerSends.length,
    earnedLeaderboard: buildLeaderboard(earnedTotals, usersById),
    peerLeaderboard: buildLeaderboard(peerSentTotals, usersById, 5, peerSendCounts),
    balanceLeaderboard: balanceEntries,
    currentUserBalanceRank: currentUserBalanceRank > 0 ? currentUserBalanceRank : null,
  };
}

export default async function Page() {
  const data = await getLeaderboardData();

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Leaderboard</h2>
          <p className="text-muted-foreground">
            Rankings for {data.monthLabel} based on recognition activity and available points.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="font-medium">{data.totalPeerRecognitions}</span>
          <span className="text-muted-foreground">peer recognitions this month</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Top earned this month</CardDescription>
            <CardTitle>{data.earnedLeaderboard[0]?.name ?? "No activity yet"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.earnedLeaderboard[0]
              ? `${data.earnedLeaderboard[0].value} points received`
              : "No points have been awarded this month."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Most active recognizer</CardDescription>
            <CardTitle>{data.peerLeaderboard[0]?.name ?? "No activity yet"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.peerLeaderboard[0]
              ? `${data.peerLeaderboard[0].value} points sent across ${data.peerLeaderboard[0].secondaryValue} peer recognitions`
              : "No peer recognition has been sent this month."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Your balance rank</CardDescription>
            <CardTitle>
              {data.currentUserBalanceRank ? `#${data.currentUserBalanceRank}` : "Unranked"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.currentUserBalanceRank
              ? `${data.currentUserName}, you are ranked among ${data.totalActiveUsers} active employees by available balance.`
              : "You do not have an active wallet balance yet."}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Top Earners</CardTitle>
            <CardDescription>Employees who received the most points this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaderboardTable
              entries={data.earnedLeaderboard}
              valueLabel="Points"
              emptyState="No points earned yet this month."
              currentUserId={data.currentUserId}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Top Recognizers</CardTitle>
            <CardDescription>Employees driving peer recognition this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaderboardTable
              entries={data.peerLeaderboard}
              valueLabel="Points Sent"
              emptyState="No peer recognition sent yet this month."
              currentUserId={data.currentUserId}
              showSecondaryValue
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Top Balances</CardTitle>
            <CardDescription>Available point balances across active employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaderboardTable
              entries={data.balanceLeaderboard}
              valueLabel="Available"
              emptyState="No wallets found for active employees."
              currentUserId={data.currentUserId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
