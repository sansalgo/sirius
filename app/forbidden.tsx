export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md space-y-3 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          403 Forbidden
        </p>
        <h1 className="text-3xl font-bold tracking-tight">You do not have access to this page.</h1>
        <p className="text-sm text-muted-foreground">
          If you should be able to see this content, ask an administrator to review your role.
        </p>
      </div>
    </main>
  )
}
