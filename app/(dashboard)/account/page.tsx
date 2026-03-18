import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePageAccess } from "@/lib/authz";
import { getTenantSeatSummary, PLAN_CONFIG } from "@/lib/subscriptions";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AccountPage() {
  const { user } = await requirePageAccess("dashboard.view");
  const isAdmin = user.role === "ADMIN";

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: {
      name: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const seatSummary = isAdmin ? await getTenantSeatSummary(user.tenantId) : null;
  const planDetails = seatSummary ? PLAN_CONFIG[seatSummary.plan] : null;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Account</h2>
        <p className="text-muted-foreground">
          Review your account details{isAdmin ? " and tenant subscription summary." : "."}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your signed-in user details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="text-muted-foreground">Name</div>
              <div className="font-medium">{user.name}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Email</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Role</div>
              <div className="font-medium">{user.role}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium">{user.status}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Tenant-level information for your organization.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <div className="text-muted-foreground">Company</div>
              <div className="font-medium">{tenant?.name ?? "Unknown tenant"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Owner</div>
              <div className="font-medium">{tenant?.owner?.name ?? "Unassigned"}</div>
              <div className="text-muted-foreground">{tenant?.owner?.email ?? "No owner email"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Access level</div>
              <div className="font-medium">
                {isAdmin ? "Admin-managed workspace" : "Standard workspace member"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Subscription visibility</div>
              <div className="font-medium">
                {isAdmin ? "Visible on this page" : "Managed by admins only"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isAdmin && seatSummary && planDetails ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                <Badge variant={seatSummary.plan === "PRO" ? "default" : "secondary"}>
                  {planDetails.label}
                </Badge>
              </CardTitle>
              <CardDescription>{planDetails.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <div className="text-muted-foreground">Subscription status</div>
                <div className="font-medium">{seatSummary.subscription?.status ?? "ACTIVE"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Billing provider</div>
                <div className="font-medium">
                  {seatSummary.subscription?.billingProvider ?? "Not connected yet"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Current period start</div>
                <div className="font-medium">
                  {formatDate(seatSummary.subscription?.currentPeriodStart)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Current period end</div>
                <div className="font-medium">
                  {formatDate(seatSummary.subscription?.currentPeriodEnd)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Seat Usage</CardTitle>
              <CardDescription>
                Owner is excluded from the count, all other members consume seats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-muted-foreground">Seats used</div>
                <div className="text-2xl font-semibold">{seatSummary.usedSeats}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Seat limit</div>
                <div className="font-medium">
                  {seatSummary.seatLimit === null ? "Unlimited" : seatSummary.seatLimit}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Remaining seats</div>
                <div className="font-medium">
                  {seatSummary.seatsRemaining === null ? "Unlimited" : seatSummary.seatsRemaining}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
