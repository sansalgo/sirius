import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || "" });
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = "Password123!";

function daysAgo(days: number, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function clearDatabase() {
  const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `);

  if (!tables.length) {
    return;
  }

  const tableNames = tables
    .map((table) => `"public"."${table.tablename}"`)
    .join(", ");

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
}

async function createCredentialUser(args: {
  tenantId: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  passwordHash: string;
}) {
  const userId = randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      name: args.name,
      email: args.email.toLowerCase(),
      emailVerified: true,
      tenantId: args.tenantId,
      role: args.role,
      status: "ACTIVE",
    },
  });

  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: args.passwordHash,
    },
  });

  await prisma.wallet.create({
    data: {
      tenantId: args.tenantId,
      userId,
      totalPoints: 0,
      reservedPoints: 0,
    },
  });

  return {
    id: userId,
    name: args.name,
    email: args.email.toLowerCase(),
    role: args.role,
  };
}

async function createLedgerEntry(args: {
  tenantId: string;
  fromUserId?: string | null;
  toUserId: string;
  amount: number;
  type: "ALLOCATION" | "PEER" | "CHALLENGE" | "REWARD";
  createdAt: Date;
}) {
  await prisma.pointLedger.create({
    data: {
      tenantId: args.tenantId,
      fromUserId: args.fromUserId ?? null,
      toUserId: args.toUserId,
      amount: args.amount,
      type: args.type,
      createdAt: args.createdAt,
    },
  });

  await prisma.wallet.update({
    where: {
      tenantId_userId: {
        tenantId: args.tenantId,
        userId: args.toUserId,
      },
    },
    data: {
      totalPoints: { increment: args.amount },
    },
  });
}

async function createRewardRedemption(args: {
  tenantId: string;
  userId: string;
  rewardId: string;
  points: number;
  status: "PENDING" | "APPROVED";
  createdAt: Date;
}) {
  await prisma.rewardRedemption.create({
    data: {
      tenantId: args.tenantId,
      userId: args.userId,
      rewardId: args.rewardId,
      points: args.points,
      status: args.status,
      createdAt: args.createdAt,
    },
  });

  if (args.status === "PENDING") {
    await prisma.wallet.update({
      where: {
        tenantId_userId: {
          tenantId: args.tenantId,
          userId: args.userId,
        },
      },
      data: {
        reservedPoints: { increment: args.points },
      },
    });
    return;
  }

  await prisma.wallet.update({
    where: {
      tenantId_userId: {
        tenantId: args.tenantId,
        userId: args.userId,
      },
    },
    data: {
      totalPoints: { decrement: args.points },
    },
  });

  await prisma.pointLedger.create({
    data: {
      tenantId: args.tenantId,
      fromUserId: null,
      toUserId: args.userId,
      amount: -args.points,
      type: "REWARD",
      createdAt: args.createdAt,
    },
  });
}

async function main() {
  await clearDatabase();

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  const tenant = await prisma.tenant.create({
    data: {
      id: randomUUID(),
      name: "Sirius Demo Company",
      subscriptionPlan: "PRO",
    },
  });

  await prisma.tenantSettings.create({
    data: {
      tenantId: tenant.id,
      managerAllocationLimit: 1200,
      managerAllocationFrequency: "MONTHLY",
      peerAllocationLimit: 250,
      peerAllocationFrequency: "MONTHLY",
    },
  });

  const admin = await createCredentialUser({
    tenantId: tenant.id,
    name: "Aarav Admin",
    email: "admin@sirius-demo.com",
    role: "ADMIN",
    passwordHash,
  });

  const managers = await Promise.all([
    createCredentialUser({
      tenantId: tenant.id,
      name: "Maya Manager",
      email: "maya.manager@sirius-demo.com",
      role: "MANAGER",
      passwordHash,
    }),
    createCredentialUser({
      tenantId: tenant.id,
      name: "Rohan Manager",
      email: "rohan.manager@sirius-demo.com",
      role: "MANAGER",
      passwordHash,
    }),
  ]);

  const employees = await Promise.all([
    createCredentialUser({
      tenantId: tenant.id,
      name: "Esha Employee",
      email: "esha.employee@sirius-demo.com",
      role: "EMPLOYEE",
      passwordHash,
    }),
    createCredentialUser({
      tenantId: tenant.id,
      name: "Kabir Employee",
      email: "kabir.employee@sirius-demo.com",
      role: "EMPLOYEE",
      passwordHash,
    }),
    createCredentialUser({
      tenantId: tenant.id,
      name: "Neha Employee",
      email: "neha.employee@sirius-demo.com",
      role: "EMPLOYEE",
      passwordHash,
    }),
    createCredentialUser({
      tenantId: tenant.id,
      name: "Ishaan Employee",
      email: "ishaan.employee@sirius-demo.com",
      role: "EMPLOYEE",
      passwordHash,
    }),
    createCredentialUser({
      tenantId: tenant.id,
      name: "Priya Employee",
      email: "priya.employee@sirius-demo.com",
      role: "EMPLOYEE",
      passwordHash,
    }),
    createCredentialUser({
      tenantId: tenant.id,
      name: "Dev Employee",
      email: "dev.employee@sirius-demo.com",
      role: "EMPLOYEE",
      passwordHash,
    }),
  ]);

  const rewards = await prisma.$transaction([
    prisma.reward.create({
      data: {
        tenantId: tenant.id,
        title: "Amazon Gift Card",
        description: "$25 voucher",
        pointsRequired: 300,
        isActive: true,
      },
    }),
    prisma.reward.create({
      data: {
        tenantId: tenant.id,
        title: "Team Lunch Voucher",
        description: "Lunch for two teammates",
        pointsRequired: 500,
        isActive: true,
      },
    }),
    prisma.reward.create({
      data: {
        tenantId: tenant.id,
        title: "Extra Day Off",
        description: "One paid day off",
        pointsRequired: 1200,
        isActive: true,
      },
    }),
  ]);

  const challenges = await Promise.all([
    prisma.challenge.create({
      data: {
        tenantId: tenant.id,
        title: "Publish a Technical Write-up",
        description: "Share a short article or note that helps the wider team.",
        instructions: "Add the public or internal link and a short summary.",
        pointsAward: 120,
        approvalRequired: false,
        isActive: true,
        createdById: admin.id,
        fields: {
          create: [
            {
              key: "article_link",
              label: "Article link",
              type: "LINK",
              required: true,
              placeholder: "https://...",
              helpText: "Paste the final article or document URL.",
              sortOrder: 0,
            },
            {
              key: "summary",
              label: "Summary",
              type: "TEXTAREA",
              required: true,
              placeholder: "What did you publish?",
              helpText: "Give reviewers context in 2-3 lines.",
              sortOrder: 1,
            },
          ],
        },
      },
      include: { fields: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.challenge.create({
      data: {
        tenantId: tenant.id,
        title: "Mentor a Teammate",
        description: "Run a focused mentoring session and document the outcome.",
        instructions: "Managers review this challenge before points are awarded.",
        pointsAward: 220,
        approvalRequired: true,
        isActive: true,
        createdById: admin.id,
        fields: {
          create: [
            {
              key: "mentee_name",
              label: "Mentee name",
              type: "TEXT",
              required: true,
              placeholder: "Who did you mentor?",
              helpText: "Enter the teammate name.",
              sortOrder: 0,
            },
            {
              key: "notes_link",
              label: "Session notes link",
              type: "LINK",
              required: true,
              placeholder: "https://...",
              helpText: "Link to notes, agenda, or recording.",
              sortOrder: 1,
            },
            {
              key: "outcome",
              label: "Outcome",
              type: "TEXTAREA",
              required: true,
              placeholder: "What changed after the session?",
              helpText: "Explain the result of the mentoring session.",
              sortOrder: 2,
            },
          ],
        },
      },
      include: { fields: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.challenge.create({
      data: {
        tenantId: tenant.id,
        title: "Run an Internal Demo",
        description: "Showcase a feature, tool, or process improvement to the team.",
        instructions: "Upload the meeting link and describe the demo topic.",
        pointsAward: 180,
        approvalRequired: false,
        isActive: true,
        createdById: admin.id,
        fields: {
          create: [
            {
              key: "demo_link",
              label: "Demo link",
              type: "LINK",
              required: true,
              placeholder: "https://...",
              helpText: "Meeting recording, event page, or deck link.",
              sortOrder: 0,
            },
            {
              key: "topic",
              label: "Demo topic",
              type: "TEXT",
              required: true,
              placeholder: "What did you demo?",
              helpText: "Provide a short title.",
              sortOrder: 1,
            },
          ],
        },
      },
      include: { fields: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  await createLedgerEntry({
    tenantId: tenant.id,
    fromUserId: admin.id,
    toUserId: employees[0].id,
    amount: 350,
    type: "ALLOCATION",
    createdAt: daysAgo(18),
  });
  await createLedgerEntry({
    tenantId: tenant.id,
    fromUserId: admin.id,
    toUserId: employees[1].id,
    amount: 500,
    type: "ALLOCATION",
    createdAt: daysAgo(17),
  });
  await createLedgerEntry({
    tenantId: tenant.id,
    fromUserId: managers[0].id,
    toUserId: employees[2].id,
    amount: 400,
    type: "ALLOCATION",
    createdAt: daysAgo(16),
  });
  await createLedgerEntry({
    tenantId: tenant.id,
    fromUserId: managers[1].id,
    toUserId: employees[3].id,
    amount: 420,
    type: "ALLOCATION",
    createdAt: daysAgo(15),
  });
  await createLedgerEntry({
    tenantId: tenant.id,
    fromUserId: admin.id,
    toUserId: employees[4].id,
    amount: 260,
    type: "ALLOCATION",
    createdAt: daysAgo(14),
  });
  await createLedgerEntry({
    tenantId: tenant.id,
    fromUserId: managers[0].id,
    toUserId: employees[5].id,
    amount: 320,
    type: "ALLOCATION",
    createdAt: daysAgo(13),
  });

  await createLedgerEntry({
    tenantId: tenant.id,
    fromUserId: employees[0].id,
    toUserId: employees[1].id,
    amount: 40,
    type: "PEER",
    createdAt: daysAgo(9),
  });
  await createLedgerEntry({
    tenantId: tenant.id,
    fromUserId: employees[1].id,
    toUserId: employees[2].id,
    amount: 30,
    type: "PEER",
    createdAt: daysAgo(8),
  });
  await createLedgerEntry({
    tenantId: tenant.id,
    fromUserId: employees[2].id,
    toUserId: employees[0].id,
    amount: 45,
    type: "PEER",
    createdAt: daysAgo(7),
  });
  await createLedgerEntry({
    tenantId: tenant.id,
    fromUserId: employees[4].id,
    toUserId: employees[5].id,
    amount: 25,
    type: "PEER",
    createdAt: daysAgo(6),
  });

  await prisma.challengeSubmission.create({
    data: {
      tenantId: tenant.id,
      challengeId: challenges[0].id,
      userId: employees[0].id,
      pointsAwarded: challenges[0].pointsAward,
      status: "APPROVED",
      formResponse: [
        {
          key: "article_link",
          label: "Article link",
          type: "LINK",
          value: "https://intranet.sirius-demo.com/writeups/test-strategy",
        },
        {
          key: "summary",
          label: "Summary",
          type: "TEXTAREA",
          value: "Shared a lightweight testing strategy for feature teams.",
        },
      ],
      reviewedAt: daysAgo(5),
      submittedAt: daysAgo(5),
    },
  });
  await createLedgerEntry({
    tenantId: tenant.id,
    toUserId: employees[0].id,
    amount: challenges[0].pointsAward,
    type: "CHALLENGE",
    createdAt: daysAgo(5),
  });

  await prisma.challengeSubmission.create({
    data: {
      tenantId: tenant.id,
      challengeId: challenges[2].id,
      userId: employees[3].id,
      pointsAwarded: challenges[2].pointsAward,
      status: "APPROVED",
      formResponse: [
        {
          key: "demo_link",
          label: "Demo link",
          type: "LINK",
          value: "https://meet.sirius-demo.com/recordings/internal-demo",
        },
        {
          key: "topic",
          label: "Demo topic",
          type: "TEXT",
          value: "Quarterly launch readiness dashboard",
        },
      ],
      reviewedAt: daysAgo(4),
      submittedAt: daysAgo(4),
    },
  });
  await createLedgerEntry({
    tenantId: tenant.id,
    toUserId: employees[3].id,
    amount: challenges[2].pointsAward,
    type: "CHALLENGE",
    createdAt: daysAgo(4),
  });

  await prisma.challengeSubmission.create({
    data: {
      tenantId: tenant.id,
      challengeId: challenges[1].id,
      userId: employees[1].id,
      pointsAwarded: challenges[1].pointsAward,
      status: "PENDING",
      formResponse: [
        {
          key: "mentee_name",
          label: "Mentee name",
          type: "TEXT",
          value: employees[5].name,
        },
        {
          key: "notes_link",
          label: "Session notes link",
          type: "LINK",
          value: "https://docs.sirius-demo.com/mentoring/kabir-dev",
        },
        {
          key: "outcome",
          label: "Outcome",
          type: "TEXTAREA",
          value: "Covered code review standards and onboarding blockers.",
        },
      ],
      submittedAt: daysAgo(2),
    },
  });

  await prisma.challengeSubmission.create({
    data: {
      tenantId: tenant.id,
      challengeId: challenges[1].id,
      userId: employees[2].id,
      reviewerId: managers[0].id,
      pointsAwarded: challenges[1].pointsAward,
      status: "REJECTED",
      rejectionReason: "Please attach the mentoring notes link requested in the challenge.",
      formResponse: [
        {
          key: "mentee_name",
          label: "Mentee name",
          type: "TEXT",
          value: employees[4].name,
        },
        {
          key: "notes_link",
          label: "Session notes link",
          type: "LINK",
          value: "",
        },
        {
          key: "outcome",
          label: "Outcome",
          type: "TEXTAREA",
          value: "Helped with testing workflow and release checklist.",
        },
      ],
      submittedAt: daysAgo(3),
      reviewedAt: daysAgo(2),
    },
  });

  await createRewardRedemption({
    tenantId: tenant.id,
    userId: employees[0].id,
    rewardId: rewards[0].id,
    points: rewards[0].pointsRequired,
    status: "APPROVED",
    createdAt: daysAgo(1),
  });

  await createRewardRedemption({
    tenantId: tenant.id,
    userId: employees[1].id,
    rewardId: rewards[1].id,
    points: rewards[1].pointsRequired,
    status: "PENDING",
    createdAt: daysAgo(1, 14),
  });

  await prisma.peerAllocation.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: employees[0].id,
        allocationLimit: 250,
        usedAmount: 40,
        periodStart: daysAgo(10),
        periodEnd: daysAgo(-20),
      },
      {
        tenantId: tenant.id,
        userId: employees[1].id,
        allocationLimit: 250,
        usedAmount: 30,
        periodStart: daysAgo(10),
        periodEnd: daysAgo(-20),
      },
    ],
  });

  await prisma.managerAllocation.createMany({
    data: [
      {
        tenantId: tenant.id,
        managerId: managers[0].id,
        allocationLimit: 1200,
        usedAmount: 720,
        periodStart: daysAgo(10),
        periodEnd: daysAgo(-20),
      },
      {
        tenantId: tenant.id,
        managerId: managers[1].id,
        allocationLimit: 1200,
        usedAmount: 420,
        periodStart: daysAgo(10),
        periodEnd: daysAgo(-20),
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Tenant: Sirius Demo Company");
  console.log(`Default password for all users: ${DEFAULT_PASSWORD}`);
  console.table([admin, ...managers, ...employees]);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
