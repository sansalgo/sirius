import { Reward, columns } from "./columns"
import { DataTable } from "./data-table"
import { AddRewardModal } from "@/components/add-reward-modal"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

async function getData(): Promise<Reward[]> {
    const reqHeaders = await headers()
    const session = await auth.api.getSession({ headers: reqHeaders })

    if (!session?.user?.id) {
        redirect("/login")
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    if (!currentUser?.tenantId) {
        return []
    }

    const rewards = await prisma.reward.findMany({
        where: { tenantId: currentUser.tenantId },
        orderBy: { createdAt: 'desc' }
    })

    return rewards.map(reward => ({
        ...reward,
        createdAt: reward.createdAt.toISOString(),
        updatedAt: reward.updatedAt.toISOString(),
    }))
}

export default async function RewardsPage() {
    const data = await getData()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Rewards</h2>
                <div className="flex items-center space-x-2">
                    <AddRewardModal />
                </div>
            </div>
            <DataTable columns={columns} data={data} />
        </div>
    )
}
