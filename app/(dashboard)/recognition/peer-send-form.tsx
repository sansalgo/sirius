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

type PeerSendFormProps = {
  users: { id: string; name: string; email: string }[];
};

export function PeerSendForm({ users }: PeerSendFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SendPeerPointsInput>({
    resolver: zodResolver(sendPeerPointsSchema),
    defaultValues: {
      toUserId: "",
      amount: 0,
      message: "",
    },
  });
  const selectedUserId = useWatch({ control: form.control, name: "toUserId" });

  const onSubmit = (data: SendPeerPointsInput) => {
    startTransition(async () => {
      const result = await sendPeerPointsAction(data);
      if (result?.error) {
        form.setError("root", { message: result.error });
        return;
      }
      form.reset({ toUserId: "", amount: 0, message: "" });
      setOpen(false);
      router.refresh();
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);

    if (!isOpen) {
      form.reset({ toUserId: "", amount: 0, message: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CirclePlus />
          <span className="hidden lg:inline">Send Recognition</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Peer Recognition</DialogTitle>
          <DialogDescription>
            Send peer-to-peer points to a teammate within your current budget.
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
              onValueChange={(value) => {
                form.setValue("toUserId", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger id="toUserId" className="w-full">
                <SelectValue placeholder="Choose Employee" />
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

          <Field>
            <FieldLabel htmlFor="message">Message (optional)</FieldLabel>
            <Input id="message" disabled={isPending} {...form.register("message")} />
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
