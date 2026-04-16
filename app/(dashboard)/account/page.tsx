import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requirePageAccess } from "@/lib/authz";
import { getTenantSeatSummary, PLAN_CONFIG } from "@/lib/subscriptions";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRole(role: string) {
  if (role === "ADMIN") return "Admin";
  if (role === "MANAGER") return "Manager";
  return "Employee";
}

export default async function AccountPage() {
  const { user } = await requirePageAccess("dashboard.view");
  const isAdmin = user.role === "ADMIN";

  const [dbUser, tenant, seatSummary] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { createdAt: true },
    }),
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        name: true,
        owner: { select: { name: true, email: true } },
      },
    }),
    isAdmin ? getTenantSeatSummary(user.tenantId) : Promise.resolve(null),
  ]);

  const planConfig = seatSummary ? PLAN_CONFIG[seatSummary.plan] : null;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account</h2>
        <p className="text-sm text-muted-foreground">
          Your profile and workspace details.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal account information.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <dl className="grid grid-cols-[140px_1fr] gap-y-3">
              <dt className="text-muted-foreground self-center">Name</dt>
              <dd className="font-medium">{user.name}</dd>

              <dt className="text-muted-foreground self-center">Email</dt>
              <dd className="font-medium">{user.email}</dd>

              <dt className="text-muted-foreground self-center">Role</dt>
              <dd>
                <Badge variant="secondary">{formatRole(user.role)}</Badge>
              </dd>

              <dt className="text-muted-foreground self-center">Status</dt>
              <dd>
                <Badge variant={user.status === "ACTIVE" ? "default" : "outline"}>
                  {user.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
              </dd>

              <dt className="text-muted-foreground self-center">Member since</dt>
              <dd className="font-medium">{formatDate(dbUser?.createdAt)}</dd>
            </dl>
          </CardContent>
        </Card>

        {/* Workspace */}
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Your organization details.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <dl className="grid grid-cols-[140px_1fr] gap-y-3">
              <dt className="text-muted-foreground self-start pt-0.5">
                Organization
              </dt>
              <dd className="font-medium">{tenant?.name ?? "—"}</dd>

              <dt className="text-muted-foreground self-start pt-0.5">Owner</dt>
              <dd>
                <div className="font-medium">
                  {tenant?.owner?.name ?? "Unassigned"}
                </div>
                {tenant?.owner?.email && (
                  <div className="text-xs text-muted-foreground">
                    {tenant.owner.email}
                  </div>
                )}
              </dd>
            </dl>

            {isAdmin && seatSummary && planConfig && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{planConfig.label} plan</span>
                      <Badge
                        variant={
                          seatSummary.plan === "PRO" ? "default" : "secondary"
                        }
                      >
                        {seatSummary.plan}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {seatSummary.usedSeats} seat
                      {seatSummary.usedSeats !== 1 ? "s" : ""} used
                      {seatSummary.seatLimit !== null
                        ? ` · ${seatSummary.seatsRemaining} remaining`
                        : " · unlimited"}
                    </p>
                  </div>
                  <Link href="/billing">
                    <Button variant="outline" size="sm">
                      Manage billing
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
