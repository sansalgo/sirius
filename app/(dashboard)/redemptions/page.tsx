import { requirePageAccess } from "@/lib/authz";
import { can } from "@/lib/rbac";
import { getTenantRedemptions, getUserRedemptions } from "@/actions/redemption";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RedemptionActions } from "./redemption-actions";

function getStatusVariant(status: "PENDING" | "APPROVED" | "REJECTED") {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

export default async function RedemptionsPage() {
  const { session, user } = await requirePageAccess("redemptions.view");
  const canReview = can(user.role, "redemptions.review");

  const result = canReview ? await getTenantRedemptions() : await getUserRedemptions();
  const rawRedemptions = (result?.redemptions ?? []) as Array<{
    id: string;
    points: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: Date;
    user?: { name: string; email: string };
    reward: { title: string };
    rejectionReason?: string | null;
  }>;

  const redemptions = rawRedemptions.map((redemption) => ({
    id: redemption.id,
    points: redemption.points,
    status: redemption.status,
    createdAt: redemption.createdAt,
    user: redemption.user ?? { name: session.user.name || "Employee", email: session.user.email || "" },
    reward: redemption.reward,
    rejectionReason: redemption.rejectionReason ?? null,
  })) as Array<{
    id: string;
    points: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: Date;
    user: { name: string; email: string };
    reward: { title: string };
    rejectionReason: string | null;
  }>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Redemptions</h2>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {redemptions.length ? (
              redemptions.map((redemption) => (
                <TableRow key={redemption.id}>
                  <TableCell className="font-medium">
                    <div>{redemption.user.name}</div>
                    <div className="text-xs text-muted-foreground">{redemption.user.email}</div>
                  </TableCell>
                  <TableCell>{redemption.reward.title}</TableCell>
                  <TableCell>{redemption.points}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(redemption.status)}>{redemption.status}</Badge>
                    {redemption.status === "REJECTED" && redemption.rejectionReason ? (
                      <p className="text-xs text-muted-foreground mt-1">{redemption.rejectionReason}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {new Date(redemption.createdAt).toLocaleDateString()}{" "}
                    {new Date(redemption.createdAt).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <RedemptionActions
                      redemptionId={redemption.id}
                      status={redemption.status}
                      canReview={canReview}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No redemption requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
