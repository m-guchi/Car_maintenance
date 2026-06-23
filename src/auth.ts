import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Passkey from "next-auth/providers/passkey";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { authConfig } from "@/auth.config";
import { applyAuthUrlEnv } from "@/lib/auth-url";
import { notifyDiscordLogin, notifyDiscordSignup } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

applyAuthUrlEnv();

let skipNextPasskeyLoginNotification = false;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  experimental: { enableWebAuthn: true },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    }),
    Passkey({
      formFields: {
        email: {
          label: "Email",
          type: "email",
          required: true,
          autocomplete: "username webauthn",
        },
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.email) {
        await notifyDiscordSignup({
          email: user.email,
          name: user.name,
          provider: "google",
        });
      }
    },
    linkAccount({ account }) {
      if (account.provider === "passkey") {
        skipNextPasskeyLoginNotification = true;
      }
    },
    async signIn({ user, account, isNewUser }) {
      if (user.email && !isNewUser) {
        if (
          account?.provider === "passkey" &&
          skipNextPasskeyLoginNotification
        ) {
          skipNextPasskeyLoginNotification = false;
          return;
        }

        await notifyDiscordLogin({
          email: user.email,
          name: user.name,
          provider: account?.provider,
        });
      }
    },
  },
});
