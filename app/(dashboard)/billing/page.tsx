import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UpgradeToProButton } from "@/components/upgrade-to-pro-button";
import { ReconcileBillingButton } from "@/components/reconcile-billing-button";
import { requirePageAccess } from "@/lib/authz";
import { getRazorpayCheckoutConfig } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import {
  formatCurrencyFromPaise,
  getLatestTenantSubscription,
  getTenantSeatSummary,
  PLAN_CONFIG,
} from "@/lib/subscriptions";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSubscriptionStatus(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "Active",
    TRIALING: "Pending authorization",
    PAST_DUE: "Past due",
    CANCELED: "Canceled",
    EXPIRED: "Expired",
  };
  return map[status] ?? status;
}

function getSubStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "PAST_DUE") return "destructive";
  if (status === "TRIALING") return "secondary";
  return "outline";
}

function getBillingStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "PAID") return "default";
  if (status === "PENDING") return "secondary";
  if (status === "FAILED") return "destructive";
  return "outline";
}

function formatBillingStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function BillingPage() {
  const { user } = await requirePageAccess("dashboard.view");
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
          <p className="text-sm text-muted-foreground">
            Billing is managed by your workspace admin.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
            <CardDescription>
              Contact your workspace owner or admin for invoice and subscription
              help.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const [tenant, subscription, billings, seatSummary] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        name: true,
        owner: { select: { email: true } },
      },
    }),
    getLatestTenantSubscription(user.tenantId),
    prisma.billingRecord.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
    }),
    getTenantSeatSummary(user.tenantId),
  ]);

  const razorpayConfig = getRazorpayCheckoutConfig();
  const plan = seatSummary.plan;
  const planConfig = PLAN_CONFIG[plan];
  const subStatus = subscription?.status ?? null;
  const isOnPro =
    plan === "PRO" &&
    subscription != null &&
    ["ACTIVE", "PAST_DUE", "TRIALING"].includes(subscription.status);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
          <p className="text-sm text-muted-foreground">
            Subscription and invoice history for{" "}
            {tenant?.name ?? "your workspace"}.
          </p>
        </div>
        {subscription?.providerSubscriptionId && <ReconcileBillingButton />}
      </div>

      {/* Grace period warning */}
      {subscription?.status === "PAST_DUE" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/30">
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Payment past due
          </p>
          <p className="mt-0.5 text-amber-700 dark:text-amber-300">
            Your Pro subscription failed to renew. Existing access continues
            until{" "}
            <span className="font-medium">
              {formatDate(subscription.gracePeriodEndsAt)}
            </span>
            . Update your payment method in Razorpay to avoid interruption.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Plan card — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {planConfig.label}
                  {subStatus && (
                    <Badge variant={getSubStatusVariant(subStatus)}>
                      {formatSubscriptionStatus(subStatus)}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{planConfig.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Renewal date</dt>
                <dd className="font-medium">
                  {subscription?.currentPeriodEnd
                    ? formatDate(subscription.currentPeriodEnd)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last payment</dt>
                <dd className="font-medium">
                  {subscription?.lastPaymentAt
                    ? formatDate(subscription.lastPaymentAt)
                    : "—"}
                </dd>
              </div>
              {subscription?.billingProvider && (
                <div>
                  <dt className="text-muted-foreground">Provider</dt>
                  <dd className="font-medium capitalize">
                    {subscription.billingProvider}
                  </dd>
                </div>
              )}
            </dl>

            {!isOnPro && (
              <>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm">
                    <span className="font-semibold">
                      {formatCurrencyFromPaise(
                        razorpayConfig.proMonthlyPricePaise
                      )}
                    </span>
                    <span className="text-muted-foreground"> / month</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Unlimited seats, all features
                    </p>
                  </div>
                  <UpgradeToProButton
                    isConfigured={razorpayConfig.enabled}
                    mode={razorpayConfig.mode}
                    companyName={razorpayConfig.companyName}
                    billingEmail={
                      tenant?.owner?.email ?? razorpayConfig.supportEmail
                    }
                  />
                </div>
              </>
            )}

            {isOnPro && subscription?.status === "TRIALING" && (
              <>
                <Separator />
                <p className="text-sm text-muted-foreground">
                  Checkout initiated — complete authorization in Razorpay to
                  activate your subscription.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Seat usage — 1/3 */}
        <Card>
          <CardHeader>
            <CardTitle>Seats</CardTitle>
            <CardDescription>Active workspace members.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">
                {seatSummary.usedSeats}
              </span>
              {seatSummary.seatLimit !== null ? (
                <span className="text-lg text-muted-foreground">
                  {" "}
                  / {seatSummary.seatLimit}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {" "}
                  / unlimited
                </span>
              )}
            </div>

            {seatSummary.seatLimit !== null && (
              <div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (seatSummary.usedSeats / seatSummary.seatLimit) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {seatSummary.seatsRemaining === 0
                    ? "Seat limit reached — upgrade to add more members"
                    : `${seatSummary.seatsRemaining} seat${seatSummary.seatsRemaining === 1 ? "" : "s"} remaining`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Billing history synced from Razorpay.</CardDescription>
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
                      <div className="font-medium">
                        {billing.providerInvoiceId ?? billing.id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Issued {formatDate(billing.issuedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {billing.description ?? "Subscription billing"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {billing.periodStart || billing.periodEnd
                        ? `${formatDate(billing.periodStart)} → ${formatDate(billing.periodEnd)}`
                        : "One-time charge"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBillingStatusVariant(billing.status)}>
                        {formatBillingStatus(billing.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrencyFromPaise(
                        billing.amountInPaise,
                        billing.currency
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
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
