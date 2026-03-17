import { requirePageAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getPeerAllocationStatus } from "@/actions/peer";
import { PeerSendForm } from "./peer-send-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getData() {
  const { user } = await requirePageAccess("recognition.view");

  const [statusResult, employees, transfers] = await Promise.all([
    getPeerAllocationStatus(),
    prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        status: "ACTIVE",
        id: { not: user.id },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.pointLedger.findMany({
      where: {
        tenantId: user.tenantId,
        type: "PEER",
        OR: [{ fromUserId: user.id }, { toUserId: user.id }],
      },
      select: {
        id: true,
        fromUserId: true,
        amount: true,
        createdAt: true,
        fromUser: { select: { name: true } },
        toUser: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    currentUserId: user.id,
    employees,
    transfers,
    status: statusResult.success
      ? statusResult.status
      : {
          allocationLimit: 0,
          usedAmount: 0,
          remainingAmount: 0,
          periodStart: new Date(),
          periodEnd: new Date(),
        },
  };
}

export default async function RecognitionPage() {
  const data = await getData();

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">


      <div className="rounded-md border bg-background p-6">
        <h3 className="text-lg font-semibold">Peer Budget</h3>
        <p className="text-muted-foreground">
          Remaining:{" "}
          <span className="font-semibold">
            {data.status.remainingAmount} / {data.status.allocationLimit}
          </span>
        </p>
      </div>

      <div className="flex items-center justify-end">
        <PeerSendForm users={data.employees} />
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.transfers.length ? (
              data.transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>{transfer.fromUser?.name ?? "-"}</TableCell>
                  <TableCell>{transfer.toUser?.name ?? "-"}</TableCell>
                  <TableCell
                    className={
                      transfer.fromUserId === data.currentUserId
                        ? "font-medium text-red-600"
                        : "font-medium text-green-600"
                    }
                  >
                    {transfer.fromUserId === data.currentUserId ? "-" : "+"}
                    {transfer.amount}
                  </TableCell>
                  <TableCell>{new Date(transfer.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No peer transfers yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
