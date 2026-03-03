"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CirclePlus } from "lucide-react";

import { addRewardSchema, type AddRewardInput } from "@/schemas/reward";
import { createReward } from "@/actions/reward";

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

export function AddRewardModal() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<AddRewardInput>({
        resolver: zodResolver(addRewardSchema),
        defaultValues: {
            title: "",
            description: "",
            pointsRequired: 0,
            isActive: true,
        },
    });

    const onSubmit = (data: AddRewardInput) => {
        startTransition(async () => {
            const result = await createReward(data);
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
                <Button variant="outline" size="sm">
                    <CirclePlus />
                    <span className="hidden lg:inline">Add Reward</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Reward</DialogTitle>
                    <DialogDescription>
                        Create a new reward that employees can redeem points for.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {form.formState.errors.root && (
                        <div className="text-red-500 text-sm font-medium">
                            {form.formState.errors.root.message}
                        </div>
                    )}

                    <Field>
                        <FieldLabel htmlFor="title">Reward Title</FieldLabel>
                        <Input id="title" placeholder="Coffee Shop Gift Card" {...form.register("title")} />
                        {form.formState.errors.title && (
                            <FieldDescription className="text-red-500">{form.formState.errors.title.message}</FieldDescription>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="description">Description (Optional)</FieldLabel>
                        <Input id="description" placeholder="A $10 gift card for local coffee" {...form.register("description")} />
                        {form.formState.errors.description && (
                            <FieldDescription className="text-red-500">{form.formState.errors.description.message}</FieldDescription>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="pointsRequired">Points Required</FieldLabel>
                        <Input
                            id="pointsRequired"
                            type="number"
                            placeholder="500"
                            {...form.register("pointsRequired", { valueAsNumber: true })}
                        />
                        {form.formState.errors.pointsRequired && (
                            <FieldDescription className="text-red-500">{form.formState.errors.pointsRequired.message}</FieldDescription>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="isActive">Status</FieldLabel>
                        <select
                            id="isActive"
                            {...form.register("isActive", {
                                setValueAs: (v) => v === "true"
                            })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                        {form.formState.errors.isActive && (
                            <FieldDescription className="text-red-500">{form.formState.errors.isActive.message}</FieldDescription>
                        )}
                    </Field>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Adding..." : "Add Reward"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
