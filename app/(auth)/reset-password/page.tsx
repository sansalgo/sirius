"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Suspense } from "react";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        This reset link is invalid or has expired.{" "}
        <a href="/forgot-password" className="underline underline-offset-4">
          Request a new one
        </a>
        .
      </p>
    );
  }

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      if (error) {
        form.setError("root", { message: error.message || "Failed to reset password." });
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    });
  };

  if (done) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        Password updated! Redirecting to login…
      </p>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        {form.formState.errors.root && (
          <div className="text-red-500 text-sm font-medium">
            {form.formState.errors.root.message}
          </div>
        )}
        <Field>
          <FieldLabel htmlFor="password">New Password</FieldLabel>
          <Input id="password" type="password" {...form.register("password")} />
          {form.formState.errors.password && (
            <FieldDescription className="text-red-500">
              {form.formState.errors.password.message}
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
          <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} />
          {form.formState.errors.confirmPassword && (
            <FieldDescription className="text-red-500">
              {form.formState.errors.confirmPassword.message}
            </FieldDescription>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Update Password"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
