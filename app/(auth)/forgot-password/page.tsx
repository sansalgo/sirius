"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const { error } = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: "/reset-password",
      });

      if (error) {
        form.setError("root", { message: error.message || "Something went wrong." });
      } else {
        setSent(true);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          {sent
            ? "Check your inbox"
            : "Enter your email and we'll send you a reset link."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-muted-foreground">
            If an account exists for that email address, a password reset link has been sent.
            Check your inbox (and spam folder).
          </p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              {form.formState.errors.root && (
                <div className="text-red-500 text-sm font-medium">
                  {form.formState.errors.root.message}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <FieldDescription className="text-red-500">
                    {form.formState.errors.email.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Sending..." : "Send Reset Link"}
                </Button>
                <FieldDescription className="text-center">
                  <a href="/login" className="underline underline-offset-4 text-sm">
                    Back to login
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
