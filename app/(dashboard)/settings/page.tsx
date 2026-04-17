import { requirePageAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

async function getData() {
  const { user } = await requirePageAccess("settings.view");

  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId: user.tenantId },
    update: {},
    create: { tenantId: user.tenantId },
    select: {
      managerAllocationLimit: true,
      managerAllocationFrequency: true,
      peerAllocationLimit: true,
      peerAllocationFrequency: true,
      peerRecognitionCategoriesEnabled: true,
    },
  });

  return {
    role: user.role,
    settings,
  };
}

export default async function SettingsPage() {
  const { role, settings } = await getData();
  const canEdit = role === "ADMIN";

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <SettingsForm
        canEdit={canEdit}
        defaultValues={{
          managerAllocationLimit: settings.managerAllocationLimit,
          managerAllocationFrequency: settings.managerAllocationFrequency,
          peerAllocationLimit: settings.peerAllocationLimit,
          peerAllocationFrequency: settings.peerAllocationFrequency,
        }}
        peerRecognitionCategoriesEnabled={settings.peerRecognitionCategoriesEnabled}
      />
    </div>
  );
}
