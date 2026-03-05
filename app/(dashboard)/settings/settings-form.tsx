"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  allocationFrequencySchema,
  pointsSettingsSchema,
  type PointsSettingsInput,
} from "@/schemas/points-settings";
import { updateTenantSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

const frequencyOptions = allocationFrequencySchema.options;

type SettingsFormProps = {
  canEdit: boolean;
  defaultValues: PointsSettingsInput;
};

export function SettingsForm({ canEdit, defaultValues }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<PointsSettingsInput>({
    resolver: zodResolver(pointsSettingsSchema),
    defaultValues,
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-md border bg-background p-6">
      {form.formState.errors.root?.message ? (
        <p className="text-sm font-medium text-red-500">{form.formState.errors.root.message}</p>
      ) : null}

      {!canEdit ? (
        <p className="text-sm text-muted-foreground">
          Only OWNER and ADMIN can update tenant settings.
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
          <select
            id="managerAllocationFrequency"
            disabled={!canEdit || isPending}
            {...form.register("managerAllocationFrequency")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {frequencyOptions.map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequency === "SEMI_ANNUALLY"
                  ? "Semi Annually"
                  : `${frequency.charAt(0)}${frequency.slice(1).toLowerCase()}`}
              </option>
            ))}
          </select>
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
          <select
            id="peerAllocationFrequency"
            disabled={!canEdit || isPending}
            {...form.register("peerAllocationFrequency")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {frequencyOptions.map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequency === "SEMI_ANNUALLY"
                  ? "Semi Annually"
                  : `${frequency.charAt(0)}${frequency.slice(1).toLowerCase()}`}
              </option>
            ))}
          </select>
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
  );
}
