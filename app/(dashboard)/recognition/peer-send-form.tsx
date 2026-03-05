"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPeerPointsSchema, type SendPeerPointsInput } from "@/schemas/peer";
import { sendPeerPointsAction } from "@/actions/peer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

type PeerSendFormProps = {
  users: { id: string; name: string; email: string }[];
};

export function PeerSendForm({ users }: PeerSendFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SendPeerPointsInput>({
    resolver: zodResolver(sendPeerPointsSchema),
    defaultValues: {
      toUserId: "",
      amount: 0,
      message: "",
    },
  });

  const onSubmit = (data: SendPeerPointsInput) => {
    startTransition(async () => {
      const result = await sendPeerPointsAction(data);
      if (result?.error) {
        form.setError("root", { message: result.error });
        return;
      }
      form.reset({ toUserId: "", amount: 0, message: "" });
      router.refresh();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-md border bg-background p-6">
      <h3 className="text-lg font-semibold">Send Peer Recognition</h3>

      {form.formState.errors.root?.message ? (
        <p className="text-sm font-medium text-red-500">{form.formState.errors.root.message}</p>
      ) : null}

      <Field>
        <FieldLabel htmlFor="toUserId">Select Employee</FieldLabel>
        <select
          id="toUserId"
          disabled={isPending}
          {...form.register("toUserId")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">-- Choose Employee --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
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

      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
