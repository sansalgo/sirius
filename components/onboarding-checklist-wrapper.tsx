"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { dismissOnboarding } from "@/actions/onboarding";

type Steps = {
  settingsConfigured: boolean;
  teamInvited: boolean;
  rewardCreated: boolean;
};

export function OnboardingChecklistWrapper({ steps }: { steps: Steps }) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [, startTransition] = useTransition();

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    startTransition(async () => {
      await dismissOnboarding();
      router.refresh();
    });
  };

  const checklistSteps = [
    {
      id: "settings",
      label: "Configure point settings",
      description: "Set manager and peer allocation limits for your workspace.",
      href: "/settings",
      completed: steps.settingsConfigured,
    },
    {
      id: "team",
      label: "Invite your first team member",
      description: "Add an employee so they can start earning and giving recognition.",
      href: "/employees",
      completed: steps.teamInvited,
    },
    {
      id: "reward",
      label: "Create your first reward",
      description: "Give employees something to work towards with their points.",
      href: "/rewards",
      completed: steps.rewardCreated,
    },
  ];

  return <OnboardingChecklist steps={checklistSteps} onDismiss={handleDismiss} />;
}
