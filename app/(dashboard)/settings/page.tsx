import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

async function getData() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, tenantId: true, role: true },
  });

  if (!currentUser?.tenantId) {
    redirect("/login");
  }

  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId: currentUser.tenantId },
    update: {},
    create: { tenantId: currentUser.tenantId },
    select: {
      managerAllocationLimit: true,
      managerAllocationFrequency: true,
      peerAllocationLimit: true,
      peerAllocationFrequency: true,
    },
  });

  return {
    role: currentUser.role ?? "EMPLOYEE",
    settings,
  };
}

export default async function SettingsPage() {
  const { role, settings } = await getData();
  const canEdit = role === "OWNER" || role === "ADMIN";

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure tenant allocation rules for manager and peer point budgets.
        </p>
      </div>
      <SettingsForm
        canEdit={canEdit}
        defaultValues={{
          managerAllocationLimit: settings.managerAllocationLimit,
          managerAllocationFrequency: settings.managerAllocationFrequency,
          peerAllocationLimit: settings.peerAllocationLimit,
          peerAllocationFrequency: settings.peerAllocationFrequency,
        }}
      />
    </div>
  );
}
