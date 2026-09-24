"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import {
  clearLoginFailures,
  loginLockoutError,
  recordLoginFailure,
} from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";

export type LoginFormState = { error?: string };

/**
 * Login server action (used with useActionState).
 *
 * Auth.js v5 semantics, verified in next-auth/src/lib/actions.ts:
 * - success → signIn throws the Next.js redirect (must propagate);
 * - bad credentials → CredentialsSignin (an AuthError) is thrown → generic,
 *   non-enumerating message below.
 *
 * Phase 5 (securly): failed attempts are throttled per email and per IP via
 * the login_attempts table Phase 3 prepared. Failures only — successful
 * sign-ins never count, and each success clears the account's lockout — so
 * shared machines and test suites keep working while credential stuffing
 * stops after LOGIN_QUOTA attempts.
 */

/** Mirrors Next's private isRedirectError: success rethrows untouched. */
function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function loginAction(
  _prev: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  const key = email.toLowerCase();
  const ip = (await clientIp()) ?? "unknown";

  const lockout = await loginLockoutError(key, ip);
  if (lockout) return { error: lockout };

  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        await recordLoginFailure(key, ip);
      }
      return {
        error:
          error.type === "CredentialsSignin"
            ? "That email and password combination is not correct."
            : "Something went wrong signing you in. Please try again.",
      };
    }
    if (isNextRedirect(error)) {
      // Successful sign-in: reset the lockout, then let the redirect escape.
      await clearLoginFailures(key);
      throw error;
    }
    // Unexpected errors.
    throw error;
  }

  return {};
}

/** Sign out of the admin area and land back on the login page. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}
