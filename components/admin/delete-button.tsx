"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Two-step delete (click → confirm) instead of a native confirm() dialog:
 * deterministic for screen readers and e2e, and impossible to fire with a
 * single stray click.
 */
export function DeleteButton({
  action,
  subject,
  className,
}: {
  action: () => Promise<void>;
  subject: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={className ?? "text-destructive hover:text-destructive"}
        onClick={() => setArmed(true)}
      >
        Delete
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[12px] text-muted-foreground">
        Delete {subject}?
      </span>
      <form action={action}>
        <Button type="submit" size="sm" variant="destructive">
          Yes, delete
        </Button>
      </form>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setArmed(false)}
      >
        Cancel
      </Button>
    </span>
  );
}
