"use client";

import { useState } from "react";
import { EditRewardModal, type EditableReward } from "@/components/edit-reward-modal";
import { Button } from "@/components/ui/button";
import { RedeemButton } from "@/app/(dashboard)/rewards/redeem-button";

type RewardRowActionsProps = {
  reward: EditableReward;
  canManage: boolean;
  canRedeem: boolean;
  availablePoints: number;
};

export function RewardRowActions({
  reward,
  canManage,
  canRedeem,
  availablePoints,
}: RewardRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);

  if (!canManage && !canRedeem) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canManage ? (
        <>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <EditRewardModal reward={reward} open={editOpen} onOpenChange={setEditOpen} />
        </>
      ) : null}

      {canRedeem ? (
        <RedeemButton
          rewardId={reward.id}
          disabled={!reward.isActive || availablePoints < reward.pointsRequired}
        />
      ) : null}
    </div>
  );
}
