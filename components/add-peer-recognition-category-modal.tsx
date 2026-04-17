"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CirclePlus } from "lucide-react";
import {
  createCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/schemas/peer-recognition-category";
import { createCategoryAction, updateCategoryAction } from "@/actions/peer-recognition-categories";
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

type CategoryEditorCategory = {
  id: string;
  name: string;
  description: string | null;
  points: number;
  status: "ACTIVE" | "INACTIVE";
};

type AddCategoryModalProps = {
  peerAllocationLimit: number;
  category?: CategoryEditorCategory;
  trigger?: React.ReactNode;
};

const defaultValues: CreateCategoryInput = {
  name: "",
  description: "",
  points: 0,
  status: "ACTIVE",
};

function getInitialValues(category?: CategoryEditorCategory): CreateCategoryInput {
  if (!category) return defaultValues;
  return {
    name: category.name,
    description: category.description ?? "",
    points: category.points,
    status: category.status,
  };
}

export function AddCategoryModal({ peerAllocationLimit, category, trigger }: AddCategoryModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEditMode = Boolean(category);

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: getInitialValues(category),
  });

  const statusValue = useWatch({ control: form.control, name: "status" });

  const onSubmit = (data: CreateCategoryInput) => {
    startTransition(async () => {
      const result = isEditMode
        ? await updateCategoryAction({ id: category!.id, ...data } as UpdateCategoryInput)
        : await createCategoryAction(data);

      if (result?.error) {
        form.setError("root", { message: result.error });
        return;
      }

      form.reset(getInitialValues(category));
      setOpen(false);
      router.refresh();
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) form.reset(getInitialValues(category));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <CirclePlus />
            <span className="hidden lg:inline">Add Category</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this recognition category."
              : "Create a new peer recognition category. Points must not exceed the peer allocation limit."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          {form.formState.errors.root?.message ? (
            <p className="text-sm font-medium text-red-500">{form.formState.errors.root.message}</p>
          ) : null}

          <Field>
            <FieldLabel htmlFor="category-name">Name</FieldLabel>
            <Input
              id="category-name"
              placeholder="e.g. Above and Beyond"
              disabled={isPending}
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <FieldDescription className="text-red-500">
                {form.formState.errors.name.message}
              </FieldDescription>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="category-description">Description</FieldLabel>
            <Textarea
              id="category-description"
              placeholder="Briefly describe when to use this category"
              disabled={isPending}
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <FieldDescription className="text-red-500">
                {form.formState.errors.description.message}
              </FieldDescription>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="category-points">
              Points{peerAllocationLimit > 0 ? ` (max ${peerAllocationLimit})` : ""}
            </FieldLabel>
            <Input
              id="category-points"
              type="number"
              placeholder="e.g. 100"
              disabled={isPending}
              {...form.register("points", { valueAsNumber: true })}
            />
            {form.formState.errors.points ? (
              <FieldDescription className="text-red-500">
                {form.formState.errors.points.message}
              </FieldDescription>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="category-status">Status</FieldLabel>
            <Select
              disabled={isPending}
              value={statusValue}
              onValueChange={(val) =>
                form.setValue("status", val as "ACTIVE" | "INACTIVE", {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="category-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditMode ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
