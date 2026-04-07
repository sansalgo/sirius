"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { acceptInvitation } from "@/actions/invitation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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

export function AcceptInvitationForm({
  token,
  userEmail,
}: {
  token: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await acceptInvitation({ token, ...data });

      if (result?.error) {
        form.setError("root", { message: result.error });
        return;
      }

      // Sign in automatically after accepting
      const { error } = await authClient.signIn.email({
        email: userEmail,
        password: data.password,
      });

      if (error) {
        // Account was created; just redirect to login
        router.push("/login?invited=1");
      } else {
        router.push("/dashboard");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set your password</CardTitle>
        <CardDescription>Choose a password to activate your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {form.formState.errors.root && (
              <div className="text-red-500 text-sm font-medium">
                {form.formState.errors.root.message}
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" {...form.register("password")} />
              {form.formState.errors.password && (
                <FieldDescription className="text-red-500">
                  {form.formState.errors.password.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <FieldDescription className="text-red-500">
                  {form.formState.errors.confirmPassword.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Activating account..." : "Activate Account"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
