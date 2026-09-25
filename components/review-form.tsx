"use client";

import { useActionState, useState } from "react";
import { submitReviewAction } from "@/lib/actions/reviews";
import { cn } from "@/lib/utils";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p role="alert" className="mt-1.5 text-[13px] text-sale">
      {messages[0]}
    </p>
  );
}

const fieldClass =
  "w-full border border-input bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-ink";

/**
 * Star picker + comment box for the PDP. Uncontrolled inputs — React resets
 * them after the server action, so a successful post empties the form while
 * the success banner confirms it.
 */
export function ReviewForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(submitReviewAction, {});
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const active = hover || rating;

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <input type="hidden" name="slug" value={slug} readOnly />
      <input type="hidden" name="rating" value={rating} readOnly />

      <div>
        <h3 className="font-heading text-h5">Write a review</h3>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Stars and a few words about the fit — it shows up below straight
          away.
        </p>
      </div>

      {state.ok ? (
        <p
          role="status"
          className="rounded-md border border-forest/40 bg-forest/5 px-4 py-3 text-[14px] text-forest"
        >
          Thanks — your review is live below.
        </p>
      ) : null}
      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-sale/40 bg-sale/5 px-4 py-3 text-[14px] text-sale"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <span className="mb-1.5 block text-[13px] font-medium">
          Your rating
        </span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <span
                aria-hidden
                className={cn(
                  "text-2xl leading-none",
                  n <= active ? "text-gold" : "text-line",
                )}
              >
                ★
              </span>
            </button>
          ))}
          <span className="ml-2 text-[13px] text-muted-foreground">
            {rating} out of 5
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="rv-author" className="block text-[13px] font-medium">
          Your name
        </label>
        <input
          id="rv-author"
          name="author"
          autoComplete="name"
          maxLength={50}
          className={fieldClass}
        />
        <FieldError messages={state.fieldErrors?.author} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="rv-body" className="block text-[13px] font-medium">
          Your review
        </label>
        <textarea
          id="rv-body"
          name="body"
          rows={4}
          maxLength={1000}
          placeholder="How does it fit? Softness? Would you buy it again?"
          className={`${fieldClass} resize-y`}
        />
        <FieldError messages={state.fieldErrors?.body} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-[0.16em] text-cream uppercase transition-colors hover:bg-peach-deep hover:text-ink disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}
