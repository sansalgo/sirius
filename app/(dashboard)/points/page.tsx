import { columns } from "./columns"
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
        return { entries: [], wallet: null, activeUsers: [], role: "EMPLOYEE" }
    }

    const wallet = await prisma.wallet.findUnique({
        where: {
            tenantId_userId: {
                tenantId: currentUser.tenantId,
                userId: currentUser.id
            }
        }
    })

    const rawEntries = await prisma.pointLedger.findMany({
        where: { tenantId: currentUser.tenantId, toUserId: currentUser.id },
        include: { fromUser: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
    })

    const entries = rawEntries.map(e => ({
        id: e.id,
        amount: e.amount,
        type: e.type,
        createdAt: e.createdAt.toISOString(),
        fromUser: e.fromUser
    }))

    const activeUsers = await prisma.user.findMany({
        where: { tenantId: currentUser.tenantId, status: "ACTIVE" },
        select: { id: true, name: true, email: true }
    })

    return { entries, wallet, activeUsers, role: currentUser.role }
}

export default async function PointsPage() {
    const data = await getData()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                    Points History <span className="ml-2 text-xl font-normal text-muted-foreground">(Available Balance: {data.wallet?.balance || 0})</span>
                </h2>
                <div className="flex items-center space-x-2">
                    {["OWNER", "ADMIN", "MANAGER"].includes(data.role || "") && (
                        <AllocatePointsModal users={data.activeUsers} />
                    )}
                </div>
            </div>
            <DataTable columns={columns} data={data.entries} />
        </div>
    )
}
