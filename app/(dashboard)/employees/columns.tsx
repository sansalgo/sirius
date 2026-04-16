"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { EditEmployeeModal } from "@/components/edit-employee-modal"

// This type is used to define the shape of our data.
export type Employee = {
    id: string
    name: string
    email: string
    role: "ADMIN" | "MANAGER" | "EMPLOYEE"
    status: "ACTIVE" | "INACTIVE"
    createdAt: string
}

function EmployeeActionsCell({
    employee,
    canAssignAdminRole,
}: {
    employee: Employee
    canAssignAdminRole: boolean
}) {
    const [editOpen, setEditOpen] = useState(false)
    const canEditEmployee = canAssignAdminRole || employee.role !== "ADMIN"

    if (!canEditEmployee) {
        return <span className="text-sm text-muted-foreground">Restricted</span>
    }

    return (
        <>
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                Edit
            </Button>
            <EditEmployeeModal
                employee={employee}
                open={editOpen}
                onOpenChange={setEditOpen}
                canAssignAdminRole={canAssignAdminRole}
            />
        </>
    )
}

const baseColumns: ColumnDef<Employee>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
            const role = row.getValue("role") as string
            return (
                <Badge variant={role === "ADMIN" ? "secondary" : "outline"}>
                    {role}
                </Badge>
            )
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "ACTIVE" ? "default" : "destructive"}>
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "createdAt",
        header: "Joined At",
        cell: ({ row }) => {
            const date = new Date(row.getValue("createdAt"))
            return <div>{date.toLocaleDateString()}</div>
        },
    },
]

export function getColumns(
    canManageEmployees: boolean,
    canAssignAdminRole: boolean
): ColumnDef<Employee>[] {
    if (!canManageEmployees) {
        return baseColumns
    }

    return [
        ...baseColumns,
        {
            id: "actions",
            cell: ({ row }) => (
                <EmployeeActionsCell
                    employee={row.original}
                    canAssignAdminRole={canAssignAdminRole}
                />
            ),
        },
    ]
}
