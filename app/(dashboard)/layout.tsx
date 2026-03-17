import { AppSidebar } from "@/components/app-sidebar"
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb"
import { NavUser } from "@/components/nav-user"
import { requirePageAccess } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { can } from "@/lib/rbac"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user } = await requirePageAccess("dashboard.view")

    let availablePoints = 0
    const wallet = can(user.role, "peer.send")
        ? await prisma.wallet.findUnique({
            where: {
                tenantId_userId: {
                    tenantId: user.tenantId,
                    userId: user.id,
                },
            },
            select: { totalPoints: true, reservedPoints: true },
        })
        : null

    if (wallet) {
        availablePoints = (wallet.totalPoints ?? 0) - (wallet.reservedPoints ?? 0)
    }

    return (
        <SidebarProvider>
            <AppSidebar role={user.role} />
            <SidebarInset>
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex justify-between w-full">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator
                                orientation="vertical"
                                className="mr-2 data-[orientation=vertical]:h-4"
                            />
                            <DashboardBreadcrumb />

                        </div>
                        <div className="px-4">
                            <NavUser availablePoints={availablePoints} role={user.role} />
                        </div>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
