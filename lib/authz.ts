import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  can,
  normalizeRole,
  normalizeStatus,
  type AppRole,
  type AppStatus,
  type Permission,
} from "@/lib/rbac"

type SessionUser = {
  id: string
  name: string
  email: string
}

export type AuthContext = {
  session: {
    user: SessionUser
  }
  user: {
    id: string
    name: string
    email: string
    tenantId: string
    role: AppRole
    status: AppStatus
  }
}

export class AuthorizationError extends Error {
  code: "UNAUTHENTICATED" | "FORBIDDEN"

  constructor(code: "UNAUTHENTICATED" | "FORBIDDEN", message: string) {
    super(message)
    this.code = code
  }
}

async function loadAuthContext(): Promise<AuthContext | null> {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session?.user?.id || !session.user.email) {
    return null
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      tenantId: true,
      role: true,
      status: true,
    },
  })

  if (!currentUser?.tenantId) {
    return null
  }

  return {
    session: {
      user: {
        id: session.user.id,
        name: session.user.name ?? currentUser.name,
        email: session.user.email,
      },
    },
    user: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      tenantId: currentUser.tenantId,
      role: normalizeRole(currentUser.role),
      status: normalizeStatus(currentUser.status),
    },
  }
}

function assertActivePermission(context: AuthContext, permission?: Permission) {
  if (context.user.status !== "ACTIVE") {
    throw new AuthorizationError("FORBIDDEN", "Your account is inactive.")
  }

  if (permission && !can(context.user.role, permission)) {
    throw new AuthorizationError("FORBIDDEN", "Insufficient permissions.")
  }
}

export async function requirePageAccess(permission?: Permission) {
  const context = await loadAuthContext()

  if (!context) {
    redirect("/login")
  }

  try {
    assertActivePermission(context, permission)
  } catch (error) {
    if (error instanceof AuthorizationError && error.code === "FORBIDDEN") {
      redirect("/forbidden")
    }

    throw error
  }

  return context
}

export async function getActionAuthContext(permission?: Permission) {
  const context = await loadAuthContext()

  if (!context) {
    throw new AuthorizationError("UNAUTHENTICATED", "Unauthorized")
  }

  assertActivePermission(context, permission)
  return context
}

export function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AuthorizationError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
