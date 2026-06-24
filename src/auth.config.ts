import type { NextAuthConfig } from "next-auth";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

function isEmailAllowed(email: string | null | undefined): boolean {
  const allowedEmail = process.env.ALLOWED_EMAIL;
  if (!allowedEmail || !email) {
    return false;
  }
  return email.toLowerCase() === allowedEmail.toLowerCase();
}

export function applyTokenToSession(session: Session, token: JWT): Session {
  if (session.user) {
    session.user.id = token.id as string;
    session.user.email = token.email as string;
    session.user.name = token.name as string;
    session.user.image = token.picture as string;
  }
  return session;
}

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    signIn({ user }) {
      return isEmailAllowed(user.email);
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      } else if (!token.id && token.sub) {
        token.id = token.sub;
      }
      return token;
    },
    session({ session, token }) {
      return applyTokenToSession(session, token);
    },
  },
  providers: [],
  trustHost: true,
} satisfies NextAuthConfig;
