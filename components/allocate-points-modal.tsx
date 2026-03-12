"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { SendIcon } from "lucide-react";

import { allocatePointsSchema, type AllocatePointsInput } from "@/schemas/points";
import { allocatePoints } from "@/actions/points";

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
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AllocatePointsModalProps {
    users: { id: string; name: string; email: string }[];
}

export function AllocatePointsModal({ users }: AllocatePointsModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<AllocatePointsInput>({
        resolver: zodResolver(allocatePointsSchema),
        defaultValues: {
            toUserId: "",
            amount: 0,
        },
    });
    const selectedUserId = useWatch({ control: form.control, name: "toUserId" });

    const onSubmit = (data: AllocatePointsInput) => {
        startTransition(async () => {
            const result = await allocatePoints(data);
            if (result?.error) {
                form.setError("root", { message: result.error });
            } else if (result?.success) {
                form.reset();
                setOpen(false);
                router.refresh();
            }
        });
    };

    const handleClose = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            form.reset();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm">
                    <SendIcon className="mr-2 h-4 w-4" />
                    Allocate Points
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Allocate Points</DialogTitle>
                    <DialogDescription>
                        Send points to an active employee in your organization.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {form.formState.errors.root && (
                        <div className="text-red-500 text-sm font-medium">
                            {form.formState.errors.root.message}
                        </div>
                    )}

                    <Field>
                        <FieldLabel htmlFor="toUserId">Select Employee</FieldLabel>
                        <Select
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
                        {form.formState.errors.toUserId && (
                            <FieldDescription className="text-red-500">{form.formState.errors.toUserId.message}</FieldDescription>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="amount">Amount</FieldLabel>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="e.g. 50"
                            {...form.register("amount", { valueAsNumber: true })}
                        />
                        {form.formState.errors.amount && (
                            <FieldDescription className="text-red-500">{form.formState.errors.amount.message}</FieldDescription>
                        )}
                    </Field>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Allocating..." : "Allocate"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
