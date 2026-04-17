"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CirclePlus } from "lucide-react";
import { sendPeerPointsSchema, type SendPeerPointsInput } from "@/schemas/peer";
import { sendPeerPointsAction } from "@/actions/peer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { id: string; name: string; points: number };

type PeerSendFormProps = {
  users: { id: string; name: string; email: string }[];
  categoriesEnabled: boolean;
  categories: Category[];
};

const emptyValues: SendPeerPointsInput = {
  toUserId: "",
  amount: undefined,
  categoryId: undefined,
  message: "",
};

export function PeerSendForm({ users, categoriesEnabled, categories }: PeerSendFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SendPeerPointsInput>({
    resolver: zodResolver(sendPeerPointsSchema),
    defaultValues: emptyValues,
  });

  const selectedUserId = useWatch({ control: form.control, name: "toUserId" });
  const selectedCategoryId = useWatch({ control: form.control, name: "categoryId" });

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const onSubmit = (data: SendPeerPointsInput) => {
    startTransition(async () => {
      const result = await sendPeerPointsAction(data);
      if (result?.error) {
        form.setError("root", { message: result.error });
        return;
      }
      form.reset(emptyValues);
      setOpen(false);
      router.refresh();
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) form.reset(emptyValues);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CirclePlus />
          <span className="hidden lg:inline">Send Recognition</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Peer Recognition</DialogTitle>
          <DialogDescription>
            {categoriesEnabled
              ? "Select a recognition category and a teammate to send points."
              : "Send peer-to-peer points to a teammate within your current budget."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {form.formState.errors.root?.message ? (
            <p className="text-sm font-medium text-red-500">{form.formState.errors.root.message}</p>
          ) : null}

          <Field>
            <FieldLabel htmlFor="toUserId">Select Employee</FieldLabel>
            <Select
              disabled={isPending}
              value={selectedUserId}
              onValueChange={(value) =>
                form.setValue("toUserId", value, { shouldDirty: true, shouldValidate: true })
              }
            >
              <SelectTrigger id="toUserId" className="w-full">
                <SelectValue placeholder="Choose employee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.toUserId ? (
              <FieldDescription className="text-red-500">
                {form.formState.errors.toUserId.message}
              </FieldDescription>
            ) : null}
          </Field>

          {categoriesEnabled ? (
            <Field>
              <FieldLabel htmlFor="categoryId">Recognition Category</FieldLabel>
              <Select
                disabled={isPending}
                value={selectedCategoryId ?? ""}
                onValueChange={(value) =>
                  form.setValue("categoryId", value, { shouldDirty: true, shouldValidate: true })
                }
              >
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} — {cat.points} pts
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory ? (
                <FieldDescription>
                  This will send <span className="font-medium">{selectedCategory.points} points</span>.
                </FieldDescription>
              ) : null}
              {form.formState.errors.categoryId ? (
                <FieldDescription className="text-red-500">
                  {form.formState.errors.categoryId.message}
                </FieldDescription>
              ) : null}
            </Field>
          ) : (
            <Field>
              <FieldLabel htmlFor="amount">Points</FieldLabel>
              <Input
                id="amount"
                type="number"
                disabled={isPending}
                {...form.register("amount", { valueAsNumber: true })}
              />
              {form.formState.errors.amount ? (
                <FieldDescription className="text-red-500">
                  {form.formState.errors.amount.message}
                </FieldDescription>
              ) : null}
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="message">Message (optional)</FieldLabel>
            <Input
              id="message"
              placeholder="Add a note for your teammate"
              disabled={isPending}
              {...form.register("message")}
            />
            {form.formState.errors.message ? (
              <FieldDescription className="text-red-500">
                {form.formState.errors.message.message}
              </FieldDescription>
            ) : null}
          </Field>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
