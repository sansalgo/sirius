import { getUserRedemptions } from "@/actions/redemption";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getStatusVariant(status: "PENDING" | "APPROVED" | "REJECTED") {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

export default async function MyRewardsPage() {
  const result = await getUserRedemptions();
  const redemptions = (result?.redemptions ?? []) as Array<{
    id: string;
    points: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: Date;
    reward: { title: string };
  }>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Rewards</h2>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reward</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {redemptions.length ? (
              redemptions.map((redemption) => (
                <TableRow key={redemption.id}>
                  <TableCell className="font-medium">{redemption.reward.title}</TableCell>
                  <TableCell>{redemption.points}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(redemption.status)}>{redemption.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(redemption.createdAt).toLocaleDateString()}{" "}
                    {new Date(redemption.createdAt).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No redemptions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
