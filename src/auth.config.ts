import type { NextAuthConfig } from "next-auth";

function isEmailAllowed(email: string | null | undefined): boolean {
  const allowedEmail = process.env.ALLOWED_EMAIL;
  if (!allowedEmail || !email) {
    return false;
  }
  return email.toLowerCase() === allowedEmail.toLowerCase();
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
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  providers: [],
  trustHost: true,
} satisfies NextAuthConfig;
