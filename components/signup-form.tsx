"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signupSchema, type SignupInput } from "@/schemas/auth";
import { registerTenantAndUser } from "@/actions/auth";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      companyName: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: SignupInput) => {
    startTransition(async () => {
      const result = await registerTenantAndUser(data);
      if (result?.error) {
        form.setError("root", { message: result.error });
      } else {
        router.push("/dashboard"); // Redirect to dashboard or onboarding
      }
    });
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
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
              <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
              <Input id="companyName" type="text" placeholder="Acme Corp" {...form.register("companyName")} />
              {form.formState.errors.companyName && (
                <FieldDescription className="text-red-500">
                  {form.formState.errors.companyName.message}
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input id="name" type="text" placeholder="John Doe" {...form.register("name")} />
              {form.formState.errors.name && (
                <FieldDescription className="text-red-500">
                  {form.formState.errors.name.message}
                </FieldDescription>
              )}
            </Field>

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
              <div className="grid grid-cols-2 gap-4">
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
                  <FieldLabel htmlFor="confirm-password">
                    Confirm Password
                  </FieldLabel>
                  <Input id="confirm-password" type="password" {...form.register("confirmPassword")} />
                  {form.formState.errors.confirmPassword && (
                    <FieldDescription className="text-red-500">
                      {form.formState.errors.confirmPassword.message}
                    </FieldDescription>
                  )}
                </Field>
              </div>
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>

            <Field>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating Account..." : "Create Account"}
              </Button>
              <FieldDescription className="text-center">
                Already have an account? <a href="/login" className="underline">Sign in</a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
