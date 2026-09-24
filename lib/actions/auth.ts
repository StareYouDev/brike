"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export type LoginFormState = { error?: string };

/**
 * Login server action (used with useActionState).
 *
 * Auth.js v5 semantics, verified in next-auth/src/lib/actions.ts:
 * - success → signIn throws the Next.js redirect (must propagate);
 * - bad credentials → CredentialsSignin (an AuthError) is thrown → generic,
 *   non-enumerating message below.
 */
export async function loginAction(
  _prev: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          error.type === "CredentialsSignin"
            ? "That email and password combination is not correct."
            : "Something went wrong signing you in. Please try again.",
      };
    }
    // Re-throw: NEXT_REDIRECT (successful sign-in) and unexpected errors.
    throw error;
  }

  return {};
}

/** Sign out of the admin area and land back on the login page. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}
