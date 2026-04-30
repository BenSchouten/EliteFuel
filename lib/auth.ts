import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    CredentialsProvider({
      name: "EliteFuel demo account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase() } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clubId: user.clubId
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.clubId = (user as { clubId: string }).clubId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const email = typeof token.email === "string" ? token.email : "";
        const freshUser = email
          ? await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, role: true, clubId: true } })
          : null;
        session.user.id = freshUser?.id ?? token.sub ?? "";
        session.user.email = freshUser?.email ?? session.user.email;
        session.user.name = freshUser?.name ?? session.user.name;
        session.user.role = freshUser?.role ?? token.role as Role;
        session.user.clubId = freshUser?.clubId ?? token.clubId as string;
      }
      return session;
    }
  }
};
