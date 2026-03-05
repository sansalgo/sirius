"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"

export type PointLedgerEntry = {
    id: string
    amount: number
    type: string
    createdAt: string
    fromUser?: { name: string } | null
    toUser?: { name: string } | null
}

const LEDGER_TYPE_LABELS: Record<string, string> = {
    ALLOCATION: "Manager Allocation",
    PEER: "Peer Recognition",
    REWARD: "Reward Redemption",
    ADJUSTMENT: "Admin Adjustment",
}

const baseColumns: ColumnDef<PointLedgerEntry>[] = [
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
            const type = String(row.getValue("type"))
            return <div className="font-medium">{LEDGER_TYPE_LABELS[type] ?? type}</div>
        },
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "decimal",
            }).format(amount)

            // Color coding based on positive or negative layout
            return <div className={amount > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{amount > 0 ? `+${formatted}` : formatted}</div>
        },
    },
    {
        accessorKey: "fromUser.name",
        header: "From / Initiator",
        cell: ({ row }) => {
            const name = row.original.fromUser?.name || "System Request / Generic"
            return <div>{name}</div>
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue("createdAt"))
            return <div>{date.toLocaleDateString()} {date.toLocaleTimeString()}</div>
        },
    },
]

const recipientColumn: ColumnDef<PointLedgerEntry> = {
    accessorKey: "toUser.name",
    header: "To / Recipient",
    cell: ({ row }) => <div>{row.original.toUser?.name || "-"}</div>,
}

export const columns: ColumnDef<PointLedgerEntry>[] = baseColumns

export const columnsWithRecipient: ColumnDef<PointLedgerEntry>[] = [
    baseColumns[0],
    baseColumns[1],
    baseColumns[2],
    recipientColumn,
    baseColumns[3],
]
