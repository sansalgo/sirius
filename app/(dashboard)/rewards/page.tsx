import { AddRewardModal } from "@/components/add-reward-modal";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getUserBalance } from "@/actions/points";
import { RedeemButton } from "./redeem-button";

async function getData() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, tenantId: true, role: true },
  });

  if (!currentUser?.tenantId) {
    return {
      rewards: [],
      role: "EMPLOYEE" as const,
      availablePoints: 0,
    };
  }

  const rewards = await prisma.reward.findMany({
    where: { tenantId: currentUser.tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      pointsRequired: true,
      isActive: true,
    },
  });

  const balanceResult = await getUserBalance();

  return {
    rewards,
    role: currentUser.role ?? "EMPLOYEE",
    availablePoints: balanceResult?.success ? balanceResult.availablePoints : 0,
  };
}

export default async function RewardsPage() {
  const data = await getData();
  const canManageRewards = data.role === "ADMIN";
  const isEmployee = data.role === "EMPLOYEE";

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rewards</h2>
          <p className="text-muted-foreground">
            Available Points: <span className="font-semibold">{data.availablePoints}</span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {canManageRewards ? <AddRewardModal /> : null}
        </div>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reward Name</TableHead>
              <TableHead>Points Required</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rewards.length ? (
              data.rewards.map((reward) => (
                <TableRow key={reward.id}>
                  <TableCell className="font-medium">{reward.title}</TableCell>
                  <TableCell>{reward.pointsRequired}</TableCell>
                  <TableCell>
                    <Badge variant={reward.isActive ? "default" : "secondary"}>
                      {reward.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isEmployee ? (
                      <RedeemButton
                        rewardId={reward.id}
                        disabled={!reward.isActive || data.availablePoints < reward.pointsRequired}
                      />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No rewards found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
