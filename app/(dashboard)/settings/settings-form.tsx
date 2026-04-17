"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  allocationFrequencySchema,
  pointsSettingsSchema,
  type PointsSettingsInput,
} from "@/schemas/points-settings";
import { updateTenantSettings, togglePeerRecognitionCategories } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const frequencyOptions = allocationFrequencySchema.options;

type SettingsFormProps = {
  canEdit: boolean;
  defaultValues: PointsSettingsInput;
  peerRecognitionCategoriesEnabled: boolean;
};

export function SettingsForm({
  canEdit,
  defaultValues,
  peerRecognitionCategoriesEnabled,
}: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isTogglePending, startToggleTransition] = useTransition();

  const form = useForm<PointsSettingsInput>({
    resolver: zodResolver(pointsSettingsSchema),
    defaultValues,
  });
  const managerAllocationFrequency = useWatch({
    control: form.control,
    name: "managerAllocationFrequency",
  });
  const peerAllocationFrequency = useWatch({
    control: form.control,
    name: "peerAllocationFrequency",
  });

  const onSubmit = (data: PointsSettingsInput) => {
    startTransition(async () => {
      const result = await updateTenantSettings(data);
      if (result?.error) {
        form.setError("root", { message: result.error });
        return;
      }
      router.refresh();
    });
  };

  const handleCategoriesToggle = (enabled: boolean) => {
    startToggleTransition(async () => {
      await togglePeerRecognitionCategories({ peerRecognitionCategoriesEnabled: enabled });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 rounded-md border bg-background p-6"
      >
        {form.formState.errors.root?.message ? (
          <p className="text-sm font-medium text-red-500">{form.formState.errors.root.message}</p>
        ) : null}

        {!canEdit ? (
          <p className="text-sm text-muted-foreground">
            Only ADMIN can update tenant settings.
          </p>
        ) : null}

        <div className="space-y-4 rounded-md border p-4">
          <h3 className="text-base font-semibold">Manager Allocation Settings</h3>

          <Field>
            <FieldLabel htmlFor="managerAllocationLimit">Manager Allocation Limit</FieldLabel>
            <Input
              id="managerAllocationLimit"
              type="number"
              disabled={!canEdit || isPending}
              {...form.register("managerAllocationLimit", { valueAsNumber: true })}
            />
            {form.formState.errors.managerAllocationLimit ? (
              <FieldDescription className="text-red-500">
                {form.formState.errors.managerAllocationLimit.message}
              </FieldDescription>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="managerAllocationFrequency">Manager Allocation Frequency</FieldLabel>
            <Select
              disabled={!canEdit || isPending}
              value={managerAllocationFrequency}
              onValueChange={(value) => {
                form.setValue(
                  "managerAllocationFrequency",
                  value as PointsSettingsInput["managerAllocationFrequency"],
                  { shouldDirty: true, shouldValidate: true }
                );
              }}
            >
              <SelectTrigger id="managerAllocationFrequency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((frequency) => (
                  <SelectItem key={frequency} value={frequency}>
                    {frequency === "SEMI_ANNUALLY"
                      ? "Semi Annually"
                      : `${frequency.charAt(0)}${frequency.slice(1).toLowerCase()}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.managerAllocationFrequency ? (
              <FieldDescription className="text-red-500">
                {form.formState.errors.managerAllocationFrequency.message}
              </FieldDescription>
            ) : null}
          </Field>
        </div>

        <div className="space-y-4 rounded-md border p-4">
          <h3 className="text-base font-semibold">Peer Allocation Settings</h3>

          <Field>
            <FieldLabel htmlFor="peerAllocationLimit">Peer Allocation Limit</FieldLabel>
            <Input
              id="peerAllocationLimit"
              type="number"
              disabled={!canEdit || isPending}
              {...form.register("peerAllocationLimit", { valueAsNumber: true })}
            />
            {form.formState.errors.peerAllocationLimit ? (
              <FieldDescription className="text-red-500">
                {form.formState.errors.peerAllocationLimit.message}
              </FieldDescription>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="peerAllocationFrequency">Peer Allocation Frequency</FieldLabel>
            <Select
              disabled={!canEdit || isPending}
              value={peerAllocationFrequency}
              onValueChange={(value) => {
                form.setValue(
                  "peerAllocationFrequency",
                  value as PointsSettingsInput["peerAllocationFrequency"],
                  { shouldDirty: true, shouldValidate: true }
                );
              }}
            >
              <SelectTrigger id="peerAllocationFrequency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((frequency) => (
                  <SelectItem key={frequency} value={frequency}>
                    {frequency === "SEMI_ANNUALLY"
                      ? "Semi Annually"
                      : `${frequency.charAt(0)}${frequency.slice(1).toLowerCase()}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.peerAllocationFrequency ? (
              <FieldDescription className="text-red-500">
                {form.formState.errors.peerAllocationFrequency.message}
              </FieldDescription>
            ) : null}
          </Field>
        </div>

        <Button type="submit" disabled={!canEdit || isPending}>
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
      </form>

      <div className="space-y-4 rounded-md border bg-background p-6">
        <div>
          <h3 className="text-base font-semibold">Peer Recognition Categories</h3>
          <p className="text-sm text-muted-foreground">
            When enabled, employees must select a category to send peer recognition instead of
            entering a custom point amount.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Switch
              id="peer-categories-toggle"
              checked={peerRecognitionCategoriesEnabled}
              disabled={isTogglePending}
              onCheckedChange={handleCategoriesToggle}
            />
            <label
              htmlFor="peer-categories-toggle"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {peerRecognitionCategoriesEnabled ? "Enabled" : "Disabled"}
            </label>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href="/peer-recognition-categories">Manage Categories</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
