import { Employee, columns } from "./columns"
import { DataTable } from "./data-table"
import { AddEmployeeModal } from "@/components/add-employee-modal"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

async function getData(): Promise<Employee[]> {
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

    const users = await prisma.user.findMany({
        where: { tenantId: currentUser.tenantId },
        orderBy: { createdAt: 'desc' }
    })

    return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: (user.role as Employee["role"]) || "EMPLOYEE",
        status: (user.status as Employee["status"]) || "ACTIVE",
        createdAt: user.createdAt.toISOString(),
    }))
}

export default async function EmployeesPage() {
    const data = await getData()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-end space-y-2">
                <div className="flex items-center space-x-2">
                    <AddEmployeeModal />
                </div>
            </div>
            <DataTable columns={columns} data={data} />
        </div>
    )
}
