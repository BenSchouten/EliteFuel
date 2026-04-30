import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      clubId: string;
    };
  }

  interface User {
    role: Role;
    clubId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    clubId?: string;
  }
}
