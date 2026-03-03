"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { editEmployeeSchema, type EditEmployeeInput } from "@/schemas/employee";
import { updateEmployee } from "@/actions/employee";

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

interface EditEmployeeModalProps {
    employee: {
        id: string;
        name: string;
        role: "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE";
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditEmployeeModal({ employee, open, onOpenChange }: EditEmployeeModalProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<EditEmployeeInput>({
        resolver: zodResolver(editEmployeeSchema),
        defaultValues: {
            id: employee.id,
            name: employee.name,
            role: employee.role,
        },
    });

    const onSubmit = (data: EditEmployeeInput) => {
        startTransition(async () => {
            const result = await updateEmployee(data);
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
                    <DialogTitle>Edit Employee</DialogTitle>
                    <DialogDescription>
                        Update employee details and permission level. Emails cannot be changed here.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {form.formState.errors.root && (
                        <div className="text-red-500 text-sm font-medium">
                            {form.formState.errors.root.message}
                        </div>
                    )}

                    <Field>
                        <FieldLabel htmlFor={`name-${employee.id}`}>Full Name</FieldLabel>
                        <Input id={`name-${employee.id}`} {...form.register("name")} />
                        {form.formState.errors.name && (
                            <FieldDescription className="text-red-500">{form.formState.errors.name.message}</FieldDescription>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor={`role-${employee.id}`}>Account Role</FieldLabel>
                        <select
                            id={`role-${employee.id}`}
                            {...form.register("role")}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="EMPLOYEE">Employee</option>
                            <option value="MANAGER">Manager</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        {form.formState.errors.role && (
                            <FieldDescription className="text-red-500">{form.formState.errors.role.message}</FieldDescription>
                        )}
                    </Field>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
