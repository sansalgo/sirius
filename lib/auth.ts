import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { sendEmailVerificationEmail, sendPasswordResetEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // users get in immediately; key features gate on verification
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: url,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmailVerificationEmail({
        to: user.email,
        name: user.name,
        verifyUrl: url,
      });
    },
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24 hours
  },
});
