"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface EditEmployeeModalProps {
    employee: {
        id: string;
        name: string;
        role: "ADMIN" | "MANAGER" | "EMPLOYEE";
    };
    canAssignAdminRole: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditEmployeeModal({
    employee,
    canAssignAdminRole,
    open,
    onOpenChange,
}: EditEmployeeModalProps) {
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
    const roleValue = useWatch({ control: form.control, name: "role" });

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
                        <Select
                            value={roleValue}
                            onValueChange={(value) => {
                                form.setValue("role", value as EditEmployeeInput["role"], {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                });
                            }}
                        >
                            <SelectTrigger id={`role-${employee.id}`} className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                <SelectItem value="MANAGER">Manager</SelectItem>
                                {canAssignAdminRole ? <SelectItem value="ADMIN">Admin</SelectItem> : null}
                            </SelectContent>
                        </Select>
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
