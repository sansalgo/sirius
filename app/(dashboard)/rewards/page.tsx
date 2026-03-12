import { AddRewardModal } from "@/components/add-reward-modal";
import { RewardRowActions } from "@/components/reward-row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requirePageAccess } from "@/lib/authz";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getUserBalance } from "@/actions/points";

async function getData() {
  const { user } = await requirePageAccess("rewards.view");

  const rewards = await prisma.reward.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      pointsRequired: true,
      isActive: true,
    },
  });

  const balanceResult = await getUserBalance();

  return {
    rewards,
    role: user.role,
    availablePoints: balanceResult?.success ? balanceResult.availablePoints : 0,
  };
}

export default async function RewardsPage() {
  const data = await getData();
  const canManageRewards = can(data.role, "rewards.manage");
  const canRedeemRewards = can(data.role, "rewards.redeem");

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-end space-y-2">
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
                    <RewardRowActions
                      reward={reward}
                      canManage={canManageRewards}
                      canRedeem={canRedeemRewards}
                      availablePoints={data.availablePoints}
                    />
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
