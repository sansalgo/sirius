"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Copy, Check, CirclePlus } from "lucide-react";

import { addEmployeeSchema, type AddEmployeeInput } from "@/schemas/employee";
import { createEmployee } from "@/actions/employee";

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

export function AddEmployeeModal({ canAssignAdminRole }: { canAssignAdminRole: boolean }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [successData, setSuccessData] = useState<{ email: string; tempPass: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const form = useForm<AddEmployeeInput>({
        resolver: zodResolver(addEmployeeSchema),
        defaultValues: {
            name: "",
            email: "",
            role: "EMPLOYEE",
        },
    });

    const onSubmit = (data: AddEmployeeInput) => {
        startTransition(async () => {
            const result = await createEmployee(data);
            if (result?.error) {
                form.setError("root", { message: result.error });
            } else if (result?.success && result.tempPassword) {
                setSuccessData({ email: data.email, tempPass: result.tempPassword });
                form.reset();
                router.refresh();
            }
        });
    };

    const handleCopy = () => {
        if (successData?.tempPass) {
            navigator.clipboard.writeText(successData.tempPass);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            // Reset after animation
            setTimeout(() => setSuccessData(null), 300);
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
                {!successData ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Add Employee</DialogTitle>
                            <DialogDescription>
                                Create a new employee profile. Roles determine permission levels in the app.
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
                                <select
                                    id="role"
                                    {...form.register("role")}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="EMPLOYEE">Employee</option>
                                    <option value="MANAGER">Manager</option>
                                    {canAssignAdminRole ? <option value="ADMIN">Admin</option> : null}
                                </select>
                                {form.formState.errors.role && (
                                    <FieldDescription className="text-red-500">{form.formState.errors.role.message}</FieldDescription>
                                )}
                            </Field>

                            <DialogFooter>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Adding..." : "Add Employee"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Employee Created</DialogTitle>
                            <DialogDescription>
                                Please save this temporary password securely. You must provide it to the employee so they can log in.
                                It will only be shown this one time.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6">
                            <div className="rounded-lg border bg-muted p-4 relative">
                                <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                                <div className="font-medium mb-4">{successData.email}</div>

                                <div className="text-sm font-medium text-muted-foreground mb-1">Temporary Password</div>
                                <div className="flex items-center gap-2">
                                    <div className="font-mono bg-background px-3 py-2 rounded border flex-1 break-all">
                                        {successData.tempPass}
                                    </div>
                                    <Button size="icon" variant="outline" onClick={handleCopy}>
                                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setOpen(false)}>Done</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
