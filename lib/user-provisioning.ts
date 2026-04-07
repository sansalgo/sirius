import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { PrismaClient } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";
type UserStatus = "ACTIVE" | "INACTIVE";

export async function createCredentialUser(args: {
  email: string;
  name: string;
  /** Omit when creating an invited user — password will be set on invitation acceptance. */
  password?: string;
  tenantId: string;
  role: UserRole;
  status: UserStatus;
  emailVerified?: boolean;
  db?: PrismaClient | Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
}) {
  const userId = randomUUID();
  const normalizedEmail = args.email.toLowerCase();
  const db = args.db ?? prisma;

  const user = await db.user.create({
    data: {
      id: userId,
      email: normalizedEmail,
      name: args.name,
      emailVerified: args.emailVerified ?? false,
      tenantId: args.tenantId,
      role: args.role,
      status: args.status,
    },
  });

  // Only create an Account (credential) row when we have a password.
  // Invited users skip this step; the account row is created when they accept.
  if (args.password) {
    const passwordHash = await hashPassword(args.password);
    await db.account.create({
      data: {
        id: randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: passwordHash,
      },
    });
  }

  await db.wallet.create({
    data: {
      tenantId: args.tenantId,
      userId,
      totalPoints: 0,
      reservedPoints: 0,
    },
  });

  return user;
}
