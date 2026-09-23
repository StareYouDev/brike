"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "done">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    if (!valid) {
      setStatus("error");
      return;
    }
    setStatus("done");
  };

  if (status === "done") {
    return (
      <p className="text-[15px] font-medium text-ink">
        Welcome in — check your inbox for 10% off your first order.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="w-full max-w-md">
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
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          className="flex-1 bg-transparent py-3 text-[15px] outline-none placeholder:text-ink/55"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className="group flex items-center gap-2 py-3 pl-3 text-[13px] font-semibold tracking-[0.12em] uppercase"
        >
          Join
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
      {status === "error" ? (
        <p role="alert" className="mt-2 text-[13px] text-sale">
          Please enter a valid email address.
        </p>
      ) : null}
    </form>
  );
}
