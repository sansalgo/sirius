"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(employee.id)}
                    >
                        Copy Employee ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit employee</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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
