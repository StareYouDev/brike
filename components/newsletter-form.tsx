"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { subscribeAction } from "@/lib/actions/newsletter";

/**
 * Footer newsletter. The signup is a real server action (subscribers table
 * + quota); the success state shows the live 10% code on-screen so it works
 * even before transactional email is configured.
 */
export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeAction, {});

  if (state.ok) {
    return (
      <div className="w-full max-w-md">
        <p className="text-[15px] leading-relaxed font-medium text-ink">
          {state.code ? (
            <>
              You&rsquo;re in — use code{" "}
              <span className="border border-ink bg-peach px-2 py-0.5 font-semibold tracking-[0.12em]">
                {state.code}
              </span>{" "}
              at checkout for 10% off your first order.
            </>
          ) : (
            <>You&rsquo;re in — welcome to the list.</>
          )}
        </p>
      </div>
    );
  }

  const message = state.error ?? state.fieldErrors?.email?.[0];

  return (
    <form action={formAction} noValidate className="w-full max-w-md">
      <div className="flex items-center border-b-2 border-ink">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Your email address"
          required
          className="flex-1 bg-transparent py-3 text-[15px] outline-none placeholder:text-ink/55"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          disabled={pending}
          className="group flex items-center gap-2 py-3 pl-3 text-[13px] font-semibold tracking-[0.12em] uppercase disabled:opacity-60"
        >
          {pending ? "Joining…" : "Join"}
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>
      {message ? (
        <p role="alert" className="mt-2 text-[13px] text-sale">
          {message}
        </p>
      ) : null}
    </form>
  );
}
