"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { editRewardSchema, type EditRewardInput } from "@/schemas/reward";
import { updateReward } from "@/actions/reward";
import { Reward } from "@/app/(dashboard)/rewards/columns";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";

interface EditRewardModalProps {
    reward: Reward;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditRewardModal({ reward, open, onOpenChange }: EditRewardModalProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<EditRewardInput>({
        resolver: zodResolver(editRewardSchema),
        defaultValues: {
            id: reward.id,
            title: reward.title,
            description: reward.description || "",
            pointsRequired: reward.pointsRequired,
            isActive: reward.isActive,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                id: reward.id,
                title: reward.title,
                description: reward.description || "",
                pointsRequired: Number(reward.pointsRequired),
                isActive: reward.isActive,
            });
        }
    }, [open, reward, form]);

    const onSubmit = (data: EditRewardInput) => {
        startTransition(async () => {
            const result = await updateReward(data);
            if (result?.error) {
                form.setError("root", { message: result.error });
            } else if (result?.success) {
                onOpenChange(false);
                router.refresh();
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Reward</DialogTitle>
                    <DialogDescription>
                        Update details for {reward.title}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {form.formState.errors.root && (
                        <div className="text-red-500 text-sm font-medium">
                            {form.formState.errors.root.message}
                        </div>
                    )}

                    <Field>
                        <FieldLabel htmlFor="edit-title">Reward Title</FieldLabel>
                        <Input id="edit-title" placeholder="Coffee Shop Gift Card" {...form.register("title")} />
                        {form.formState.errors.title && (
                            <FieldDescription className="text-red-500">{form.formState.errors.title.message}</FieldDescription>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="edit-description">Description (Optional)</FieldLabel>
                        <Input id="edit-description" placeholder="A $10 gift card for local coffee" {...form.register("description")} />
                        {form.formState.errors.description && (
                            <FieldDescription className="text-red-500">{form.formState.errors.description.message}</FieldDescription>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="edit-pointsRequired">Points Required</FieldLabel>
                        <Input
                            id="edit-pointsRequired"
                            type="number"
                            {...form.register("pointsRequired", { valueAsNumber: true })}
                        />
                        {form.formState.errors.pointsRequired && (
                            <FieldDescription className="text-red-500">{form.formState.errors.pointsRequired.message}</FieldDescription>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="edit-isActive">Status</FieldLabel>
                        <select
                            id="edit-isActive"
                            {...form.register("isActive", {
                                setValueAs: (v) => v === "true" || v === true
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
                            {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
