import { notFound } from "next/navigation";
import { getInvitationByToken } from "@/actions/invitation";
import { AcceptInvitationForm } from "./accept-invitation-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Accept Invitation" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  const isInvalid = invitation.status !== "PENDING" || invitation.isExpired;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isInvalid ? "Invitation unavailable" : `Join ${invitation.tenantName}`}
          </h1>
          {!isInvalid && (
            <p className="text-sm text-muted-foreground">
              Set a password to activate your account as <strong>{invitation.userName}</strong>.
            </p>
          )}
        </div>

        {isInvalid ? (
          <div className="rounded-lg border bg-card p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {invitation.status === "ACCEPTED"
                ? "This invitation has already been accepted. You can log in directly."
                : "This invitation link has expired. Please ask your admin to send a new one."}
            </p>
            {invitation.status === "ACCEPTED" && (
              <a
                href="/login"
                className="inline-block text-sm font-medium underline underline-offset-4"
              >
                Go to login
              </a>
            )}
          </div>
        ) : (
          <AcceptInvitationForm token={token} userEmail={invitation.userEmail} />
        )}
      </div>
    </div>
  );
}
