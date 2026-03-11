"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitChallengeAction } from "@/actions/challenge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ChallengeField = {
  key: string;
  label: string;
  type: "TEXT" | "TEXTAREA" | "LINK";
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
};

type ChallengeCompleteDialogProps = {
  challenge: {
    id: string;
    title: string;
    approvalRequired: boolean;
    fields: ChallengeField[];
  };
  disabled?: boolean;
  buttonLabel?: string;
};

export function ChallengeCompleteDialog({
  challenge,
  disabled,
  buttonLabel = "Complete",
}: ChallengeCompleteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setAnswers({});
      setError(null);
    }
  };

  const handleSubmit = () => {
    setError(null);

    startTransition(async () => {
      const result = await submitChallengeAction({
        challengeId: challenge.id,
        answers: challenge.fields.map((field) => ({
          key: field.key,
          value: answers[field.key] ?? "",
        })),
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{challenge.title}</DialogTitle>
          <DialogDescription>
            {challenge.approvalRequired
              ? "Submit completion details for review. Points will be awarded after approval."
              : "Submit completion details. Points will be awarded immediately after a valid submission."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? <p className="text-sm font-medium text-red-500">{error}</p> : null}

          {challenge.fields.map((field) => (
            <Field key={field.key}>
              <FieldLabel htmlFor={`challenge-answer-${field.key}`}>
                {field.label}
                {field.required ? " *" : ""}
              </FieldLabel>

              {field.type === "TEXTAREA" ? (
                <Textarea
                  id={`challenge-answer-${field.key}`}
                  placeholder={field.placeholder ?? ""}
                  value={answers[field.key] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                />
              ) : (
                <Input
                  id={`challenge-answer-${field.key}`}
                  type={field.type === "LINK" ? "url" : "text"}
                  placeholder={field.placeholder ?? ""}
                  value={answers[field.key] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                />
              )}

              {field.helpText ? <FieldDescription>{field.helpText}</FieldDescription> : null}
            </Field>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={isPending} onClick={handleSubmit}>
            {isPending ? "Submitting..." : "Submit Completion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
