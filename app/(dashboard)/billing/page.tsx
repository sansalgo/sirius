import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UpgradeToProButton } from "@/components/upgrade-to-pro-button";
import { requirePageAccess } from "@/lib/authz";
import { getRazorpayCheckoutConfig } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { formatCurrencyFromPaise, getLatestTenantSubscription } from "@/lib/subscriptions";

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

function getStatusVariant(status: string) {
  if (status === "PAID") {
    return "default" as const;
  }

  if (status === "PENDING") {
    return "secondary" as const;
  }

  return "outline" as const;
}

export default async function BillingPage() {
  const { user } = await requirePageAccess("dashboard.view");
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
          <p className="text-muted-foreground">
            Billing records are only visible to workspace admins.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Contact your workspace owner or admin if you need invoice or subscription help.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const [tenant, subscription, billings] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        name: true,
        owner: {
          select: {
            email: true,
          },
        },
      },
    }),
    getLatestTenantSubscription(user.tenantId),
    prisma.billingRecord.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);
  const razorpayConfig = getRazorpayCheckoutConfig();
  const isOnPro = subscription?.plan === "PRO" && ["ACTIVE", "PAST_DUE", "TRIALING"].includes(subscription.status);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">
          Review subscription charges and invoice history for {tenant?.name ?? "your workspace"}.
        </p>
      </div>

      {subscription?.status === "PAST_DUE" ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle>Payment Grace Period Active</CardTitle>
            <CardDescription>
              Your Pro subscription is past due. Existing members keep access, but new invites should
              remain blocked if the grace period ends without a successful retry.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Grace period ends on {formatDate(subscription.gracePeriodEndsAt)}.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Current plan</CardDescription>
            <CardTitle>{subscription?.plan ?? "FREE"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Status: {subscription?.status ?? "ACTIVE"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Billing provider</CardDescription>
            <CardTitle>{subscription?.billingProvider ?? "Razorpay ready"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Webhook-driven billing state with tenant-level customer mapping.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Current period</CardDescription>
            <CardTitle>{formatDate(subscription?.currentPeriodEnd)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Started on {formatDate(subscription?.currentPeriodStart)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Actions</CardTitle>
          <CardDescription>
            Admin-managed recurring billing with Razorpay Checkout and webhook verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>
              Pro monthly price: {formatCurrencyFromPaise(razorpayConfig.proMonthlyPricePaise)}
            </div>
            <div>
              Mode: {razorpayConfig.mode} | Support: {razorpayConfig.supportEmail}
            </div>
            <div>
              Grace period: {razorpayConfig.gracePeriodDays} days | Auto-renew: enabled
            </div>
          </div>
          {!isOnPro ? (
            <UpgradeToProButton
              isConfigured={razorpayConfig.enabled}
              mode={razorpayConfig.mode}
              companyName={razorpayConfig.companyName}
              billingEmail={tenant?.owner?.email ?? razorpayConfig.supportEmail}
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              {subscription?.status === "TRIALING"
                ? "Checkout is initiated. Complete authorization in Razorpay to activate Pro."
                : "Your tenant is already on Pro or in its billing grace period."}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Synced from Razorpay invoices and payment events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billings.length ? (
                billings.map((billing) => (
                  <TableRow key={billing.id}>
                    <TableCell>
                      <div className="font-medium">{billing.providerInvoiceId ?? billing.id}</div>
                      <div className="text-xs text-muted-foreground">
                        Issued {formatDate(billing.issuedAt)}
                      </div>
                    </TableCell>
                    <TableCell>{billing.description ?? "Subscription billing"}</TableCell>
                    <TableCell>
                      {billing.periodStart || billing.periodEnd
                        ? `${formatDate(billing.periodStart)} to ${formatDate(billing.periodEnd)}`
                        : "One-time charge"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(billing.status)}>{billing.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrencyFromPaise(billing.amountInPaise, billing.currency)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No billing records yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
