import { Employee } from "./columns"
import { EmployeesTable } from "./employees-table"
import { AddEmployeeModal } from "@/components/add-employee-modal"

import { can } from "@/lib/rbac"
import { requirePageAccess } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

async function getData() {
    const { user } = await requirePageAccess("employees.read")

    const users = await prisma.user.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: 'desc' }
    })

    return {
        canManageEmployees: can(user.role, "employees.manage"),
        canAssignAdminRole: user.role === "ADMIN",
        employees: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: (user.role as Employee["role"]) || "EMPLOYEE",
        status: (user.status as Employee["status"]) || "ACTIVE",
        createdAt: user.createdAt.toISOString(),
        })),
    }
}

export default async function EmployeesPage() {
    const data = await getData()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-end space-y-2">
                <div className="flex items-center space-x-2">
                    {data.canManageEmployees ? <AddEmployeeModal canAssignAdminRole={data.canAssignAdminRole} /> : null}
                </div>
            </div>
            <EmployeesTable
                employees={data.employees}
                canManageEmployees={data.canManageEmployees}
                canAssignAdminRole={data.canAssignAdminRole}
            />
        </div>
    )
}
