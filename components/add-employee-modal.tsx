"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CirclePlus, MailCheck, RefreshCw } from "lucide-react";

import { addEmployeeSchema, type AddEmployeeInput } from "@/schemas/employee";
import { createEmployee } from "@/actions/employee";
import { resendInvitation } from "@/actions/invitation";

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

export function AddEmployeeModal({ canAssignAdminRole }: { canAssignAdminRole: boolean }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [invitedEmail, setInvitedEmail] = useState<string | null>(null);

    const form = useForm<AddEmployeeInput>({
        resolver: zodResolver(addEmployeeSchema),
        defaultValues: {
            name: "",
            email: "",
            role: "EMPLOYEE",
            status: "ACTIVE",
        },
    });
    const roleValue = useWatch({ control: form.control, name: "role" });
    const statusValue = useWatch({ control: form.control, name: "status" });

    const onSubmit = (data: AddEmployeeInput) => {
        startTransition(async () => {
            const result = await createEmployee(data);
            if (result?.error) {
                form.setError("root", { message: result.error });
            } else if (result?.success) {
                setInvitedEmail(data.email);
                form.reset();
                router.refresh();
            }
        });
    };

    const handleClose = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setTimeout(() => setInvitedEmail(null), 300);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <CirclePlus />
                    <span className="hidden lg:inline">Add Employee</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                {!invitedEmail ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Add Employee</DialogTitle>
                            <DialogDescription>
                                An invitation email will be sent so the employee can set their own password.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            {form.formState.errors.root && (
                                <div className="text-red-500 text-sm font-medium">
                                    {form.formState.errors.root.message}
                                </div>
                            )}

                            <Field>
                                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                                <Input id="name" placeholder="Jane Doe" {...form.register("name")} />
                                {form.formState.errors.name && (
                                    <FieldDescription className="text-red-500">{form.formState.errors.name.message}</FieldDescription>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                                <Input id="email" type="email" placeholder="jane@example.com" {...form.register("email")} />
                                {form.formState.errors.email && (
                                    <FieldDescription className="text-red-500">{form.formState.errors.email.message}</FieldDescription>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="role">Account Role</FieldLabel>
                                <Select
                                    value={roleValue}
                                    onValueChange={(value) => {
                                        form.setValue("role", value as AddEmployeeInput["role"], {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        });
                                    }}
                                >
                                    <SelectTrigger id="role" className="w-full">
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

                            {canAssignAdminRole ? (
                                <Field>
                                    <FieldLabel htmlFor="status">Status</FieldLabel>
                                    <Select
                                        value={statusValue}
                                        onValueChange={(value) => {
                                            form.setValue("status", value as AddEmployeeInput["status"], {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                            });
                                        }}
                                    >
                                        <SelectTrigger id="status" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">Active</SelectItem>
                                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.status && (
                                        <FieldDescription className="text-red-500">{form.formState.errors.status.message}</FieldDescription>
                                    )}
                                </Field>
                            ) : null}

                            <DialogFooter>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Sending invite..." : "Send Invitation"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <InvitationSentView email={invitedEmail} onClose={() => setOpen(false)} />
                )}
            </DialogContent>
        </Dialog>
    );
}

function InvitationSentView({ email, onClose }: { email: string; onClose: () => void }) {
    return (
        <>
            <DialogHeader>
                <DialogTitle>Invitation Sent</DialogTitle>
                <DialogDescription>
                    The employee will receive an email to set their password and join your workspace.
                </DialogDescription>
            </DialogHeader>
            <div className="py-6 flex flex-col items-center gap-3 text-center">
                <MailCheck className="h-10 w-10 text-green-500" />
                <p className="text-sm text-muted-foreground">
                    An invitation email was sent to <strong>{email}</strong>.
                    <br />
                    The link expires in 7 days.
                </p>
            </div>
            <DialogFooter>
                <Button onClick={onClose}>Done</Button>
            </DialogFooter>
        </>
    );
}
