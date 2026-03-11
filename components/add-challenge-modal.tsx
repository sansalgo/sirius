"use client";

import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CirclePlus, Trash2 } from "lucide-react";
import {
  challengeFieldTypes,
  createChallengeSchema,
  type CreateChallengeInput,
} from "@/schemas/challenge";
import { createChallengeAction, updateChallengeAction } from "@/actions/challenge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ChallengeFieldValue = {
  key: string;
  label: string;
  type: "TEXT" | "TEXTAREA" | "LINK";
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
};

type ChallengeEditorChallenge = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  pointsAward: number;
  approvalRequired: boolean;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  fields: ChallengeFieldValue[];
};

type AddChallengeModalProps = {
  challenge?: ChallengeEditorChallenge;
  trigger?: React.ReactNode;
};

const defaultValues: CreateChallengeInput = {
  title: "",
  description: "",
  instructions: "",
  pointsAward: 0,
  approvalRequired: false,
  isActive: true,
  startDate: "",
  endDate: "",
  fields: [
    {
      key: "proof_link",
      label: "Proof link",
      type: "LINK",
      placeholder: "https://...",
      helpText: "Paste the link reviewers can use to verify completion.",
      required: true,
    },
  ],
};

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function getInitialValues(challenge?: ChallengeEditorChallenge): CreateChallengeInput {
  if (!challenge) {
    return defaultValues;
  }

  return {
    title: challenge.title,
    description: challenge.description ?? "",
    instructions: challenge.instructions ?? "",
    pointsAward: challenge.pointsAward,
    approvalRequired: challenge.approvalRequired,
    isActive: challenge.isActive,
    startDate: toDateInputValue(challenge.startDate),
    endDate: toDateInputValue(challenge.endDate),
    fields: challenge.fields.map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      placeholder: field.placeholder ?? "",
      helpText: field.helpText ?? "",
      required: field.required,
    })),
  };
}

export function AddChallengeModal({ challenge, trigger }: AddChallengeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const initialValues = getInitialValues(challenge);
  const isEditMode = Boolean(challenge);

  const form = useForm<CreateChallengeInput>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: initialValues,
  });

  const fields = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const onSubmit = (data: CreateChallengeInput) => {
    startTransition(async () => {
      const result = isEditMode
        ? await updateChallengeAction({ id: challenge!.id, ...data })
        : await createChallengeAction(data);

      if (result?.error) {
        form.setError("root", { message: result.error });
        return;
      }

      form.reset(getInitialValues(challenge));
      setOpen(false);
      router.refresh();
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    form.reset(getInitialValues(challenge));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <CirclePlus />
            <span className="hidden lg:inline">Add Challenge</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Challenge" : "Create Challenge"}</DialogTitle>
          <DialogDescription>
            Define how users prove completion and whether points are awarded instantly or after review.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {form.formState.errors.root?.message ? (
            <p className="text-sm font-medium text-red-500">{form.formState.errors.root.message}</p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="challenge-title">Title</FieldLabel>
              <Input id="challenge-title" {...form.register("title")} />
              {form.formState.errors.title ? (
                <FieldDescription className="text-red-500">
                  {form.formState.errors.title.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="challenge-points">Points Award</FieldLabel>
              <Input
                id="challenge-points"
                type="number"
                {...form.register("pointsAward", { valueAsNumber: true })}
              />
              {form.formState.errors.pointsAward ? (
                <FieldDescription className="text-red-500">
                  {form.formState.errors.pointsAward.message}
                </FieldDescription>
              ) : null}
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="challenge-description">Description</FieldLabel>
            <Input
              id="challenge-description"
              placeholder="Short summary shown in the challenge list"
              {...form.register("description")}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="challenge-instructions">Instructions</FieldLabel>
            <Textarea
              id="challenge-instructions"
              placeholder="Tell users exactly what they need to complete and what to submit."
              {...form.register("instructions")}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="challenge-approval">Approval Flow</FieldLabel>
              <select
                id="challenge-approval"
                {...form.register("approvalRequired", {
                  setValueAs: (value) => value === "true" || value === true,
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="false">No approval required</option>
                <option value="true">Manager/Admin approval required</option>
              </select>
              <FieldDescription>
                Choose whether valid submissions credit points instantly or go through review first.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="challenge-active">Status</FieldLabel>
              <select
                id="challenge-active"
                {...form.register("isActive", {
                  setValueAs: (value) => value === "true" || value === true,
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="challenge-start-date">Start Date</FieldLabel>
              <Input id="challenge-start-date" type="date" {...form.register("startDate")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="challenge-end-date">End Date</FieldLabel>
              <Input id="challenge-end-date" type="date" {...form.register("endDate")} />
              {form.formState.errors.endDate ? (
                <FieldDescription className="text-red-500">
                  {form.formState.errors.endDate.message}
                </FieldDescription>
              ) : null}
            </Field>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold">Submission Form</h3>
                <p className="text-sm text-muted-foreground">
                  Configure the fields users must fill when they mark this challenge as completed.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  fields.append({
                    key: "",
                    label: "",
                    type: "TEXT",
                    placeholder: "",
                    helpText: "",
                    required: true,
                  })
                }
              >
                Add Field
              </Button>
            </div>

            {fields.fields.map((field, index) => (
              <div key={field.id} className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Field {index + 1}</h4>
                  {fields.fields.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fields.remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`fields.${index}.label`}>Label</FieldLabel>
                    <Input id={`fields.${index}.label`} {...form.register(`fields.${index}.label`)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`fields.${index}.key`}>Key</FieldLabel>
                    <Input
                      id={`fields.${index}.key`}
                      placeholder="example_proof_link"
                      {...form.register(`fields.${index}.key`)}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor={`fields.${index}.type`}>Type</FieldLabel>
                    <select
                      id={`fields.${index}.type`}
                      {...form.register(`fields.${index}.type`)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {challengeFieldTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`fields.${index}.required`}>Required</FieldLabel>
                    <select
                      id={`fields.${index}.required`}
                      {...form.register(`fields.${index}.required`, {
                        setValueAs: (value) => value === "true" || value === true,
                      })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="true">Required</option>
                      <option value="false">Optional</option>
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`fields.${index}.placeholder`}>Placeholder</FieldLabel>
                    <Input
                      id={`fields.${index}.placeholder`}
                      {...form.register(`fields.${index}.placeholder`)}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor={`fields.${index}.helpText`}>Help Text</FieldLabel>
                  <Input
                    id={`fields.${index}.helpText`}
                    placeholder="Explain what the reviewer should look for"
                    {...form.register(`fields.${index}.helpText`)}
                  />
                </Field>

                {form.formState.errors.fields?.[index] ? (
                  <FieldDescription className="text-red-500">
                    {form.formState.errors.fields[index]?.label?.message ||
                      form.formState.errors.fields[index]?.key?.message ||
                      form.formState.errors.fields[index]?.placeholder?.message ||
                      form.formState.errors.fields[index]?.helpText?.message}
                  </FieldDescription>
                ) : null}
              </div>
            ))}

            {typeof form.formState.errors.fields?.message === "string" ? (
              <FieldDescription className="text-red-500">
                {form.formState.errors.fields.message}
              </FieldDescription>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditMode ? "Save Changes" : "Create Challenge"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
