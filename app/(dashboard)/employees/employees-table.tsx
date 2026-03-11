"use client"

import { DataTable } from "./data-table"
import { type Employee, getColumns } from "./columns"

export function EmployeesTable({
    employees,
    canManageEmployees,
    canAssignAdminRole,
}: {
    employees: Employee[]
    canManageEmployees: boolean
    canAssignAdminRole: boolean
}) {
    return (
        <DataTable
            columns={getColumns(canManageEmployees, canAssignAdminRole)}
            data={employees}
        />
    )
}
