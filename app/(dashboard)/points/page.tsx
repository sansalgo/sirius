import { columns, columnsWithRecipient } from "./columns"
import { DataTable } from "./data-table"
import { AllocatePointsModal } from "@/components/allocate-points-modal"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

async function getData() {
    const reqHeaders = await headers()
    const session = await auth.api.getSession({ headers: reqHeaders })

    if (!session?.user?.id) {
        redirect("/login")
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    if (!currentUser?.tenantId) {
        return { entries: [], wallet: null, activeUsers: [], role: "EMPLOYEE", isElevatedRole: false, availablePoints: 0 }
    }

    const wallet = await prisma.wallet.findUnique({
        where: {
            tenantId_userId: {
                tenantId: currentUser.tenantId,
                userId: currentUser.id
            }
        },
        select: { totalPoints: true, reservedPoints: true }
    })

    const isElevatedRole = ["ADMIN", "MANAGER"].includes(currentUser.role || "")

    const rawEntries = await prisma.pointLedger.findMany({
        where: {
            tenantId: currentUser.tenantId,
            ...(isElevatedRole ? {} : { toUserId: currentUser.id }),
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
        where: { tenantId: currentUser.tenantId, status: "ACTIVE" },
        select: { id: true, name: true, email: true }
    })

    const availablePoints = (wallet?.totalPoints ?? 0) - (wallet?.reservedPoints ?? 0)

    return { entries, wallet, activeUsers, role: currentUser.role, isElevatedRole, availablePoints }
}

export default async function PointsPage() {
    const data = await getData()
    const tableColumns = data.isElevatedRole ? columnsWithRecipient : columns

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                    Points History <span className="ml-2 text-xl font-normal text-muted-foreground">(Available Balance: {data.availablePoints})</span>
                </h2>
                <div className="flex items-center space-x-2">
                    {["ADMIN", "MANAGER"].includes(data.role || "") && (
                        <AllocatePointsModal users={data.activeUsers} />
                    )}
                </div>
            </div>
            <DataTable columns={tableColumns} data={data.entries} enableLedgerTypeFilter />
        </div>
    )
}
