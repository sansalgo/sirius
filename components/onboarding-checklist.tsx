"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Step = {
  id: string;
  label: string;
  description: string;
  href: string;
  completed: boolean;
};

type OnboardingChecklistProps = {
  steps: Step[];
  onDismiss: () => void;
};

export function OnboardingChecklist({ steps, onDismiss }: OnboardingChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);
  const completedCount = steps.filter((s) => s.completed).length;
  const allDone = completedCount === steps.length;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base">
              {allDone ? "Setup complete!" : "Get started with Sirius"}
            </CardTitle>
            <CardDescription>
              {allDone
                ? "Your workspace is fully set up. You can dismiss this."
                : `${completedCount} of ${steps.length} steps complete`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onDismiss}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-0">
          <ul className="space-y-3">
            {steps.map((step) => (
              <li key={step.id}>
                <Link
                  href={step.completed ? "#" : step.href}
                  className={`flex items-start gap-3 rounded-md p-2 transition-colors ${
                    step.completed
                      ? "pointer-events-none opacity-60"
                      : "hover:bg-muted cursor-pointer"
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <div className="text-sm font-medium leading-none">{step.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{step.description}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
