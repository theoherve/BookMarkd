import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import {
  authenticateWithCredentials,
  toPublicUser,
} from "@/lib/auth/credentials";
import db from "@/lib/supabase/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "camille@example.com",
        },
        password: {
          label: "Mot de passe",
          type: "password",
          placeholder: "••••••••",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const authenticatedUser = await authenticateWithCredentials(
          credentials.email,
          credentials.password,
        );

        if (!authenticatedUser) {
          return null;
        }

        const publicUser = toPublicUser(authenticatedUser);

        return {
          id: publicUser.id,
          name: publicUser.name,
          email: publicUser.email,
          image: publicUser.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image ?? undefined;

        // Fetch admin status at login time and store in JWT
        try {
          const { data } = await db.client
            .from("users")
            .select("is_admin")
            .eq("id", user.id)
            .maybeSingle();
          token.isAdmin = data?.is_admin ?? false;
        } catch {
          token.isAdmin = false;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.image = (token.picture as string | null) ?? undefined;
        session.user.isAdmin = token.isAdmin ?? false;
      }

      return session;
    },
  },
};
