import { columns, columnsWithRecipient } from "./columns"
import { DataTable } from "./data-table"
import { AllocatePointsModal } from "@/components/allocate-points-modal"

import { can } from "@/lib/rbac"
import { requirePageAccess } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

async function getData() {
    const { user } = await requirePageAccess("points.view")

    const wallet = await prisma.wallet.findUnique({
        where: {
            tenantId_userId: {
                tenantId: user.tenantId,
                userId: user.id
            }
        },
        select: { totalPoints: true, reservedPoints: true }
    })

    const isElevatedRole = can(user.role, "points.allocate")

    const rawEntries = await prisma.pointLedger.findMany({
        where: {
            tenantId: user.tenantId,
            ...(isElevatedRole ? {} : { toUserId: user.id }),
        },
        include: {
            fromUser: { select: { name: true } },
            toUser: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' }
    })

    const entries = rawEntries.map(e => ({
        id: e.id,
        amount: e.amount,
        type: e.type,
        createdAt: e.createdAt.toISOString(),
        fromUser: e.fromUser,
        toUser: e.toUser,
    }))

    const activeUsers = await prisma.user.findMany({
        where: { tenantId: user.tenantId, status: "ACTIVE" },
        select: { id: true, name: true, email: true }
    })

    const availablePoints = (wallet?.totalPoints ?? 0) - (wallet?.reservedPoints ?? 0)

    return { entries, wallet, activeUsers, role: user.role, isElevatedRole, availablePoints }
}

export default async function PointsPage() {
    const data = await getData()
    const tableColumns = data.isElevatedRole ? columnsWithRecipient : columns
    const toolbarAction = can(data.role, "points.allocate")
        ? <AllocatePointsModal users={data.activeUsers} />
        : null

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <DataTable
                columns={tableColumns}
                data={data.entries}
                enableLedgerTypeFilter
                toolbarAction={toolbarAction}
            />
        </div>
    )
}
