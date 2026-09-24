/**
 * Auth.js (NextAuth v5) — single Credentials admin provider.
 *
 * Security notes (securly):
 * - Credentials are checked with bcryptjs against the users table; an unknown
 *   email still runs a compare against a precomputed cost-10 hash so response
 *   timing does not reveal whether an account exists.
 * - Sign-in failures surface only generic messages in the UI (see
 *   lib/actions/auth.ts); details stay in server logs.
 * - trustHost: true is required by Auth.js' UntrustedHost assert (the request
 *   host comes from proxy headers on Vercel).
 * - proxy.ts does a cookie-presence pre-check only; `auth()` below performs
 *   the real JWT validation and is the authoritative guard.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** Precomputed bcrypt (cost 10) hash — compared when the email is unknown. */
const DUMMY_PASSWORD_HASH =
  "$2b$10$YFeSgOVn3qFqxtvY45oKO.dXiuoIjPpKqU/Z.2vrdXlDSvF6b7NPG";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const db = await getDb();
        const [user] = await db
          .select()
          .from(users)
          .where(sql`lower(${users.email}) = lower(${email})`)
          .limit(1);

        const valid = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_PASSWORD_HASH,
        );
        if (!user || !valid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});
