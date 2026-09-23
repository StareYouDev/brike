import { cn } from "@/lib/utils";

export function Stars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const full = Math.round(rating);
  return (
    <span
      className={cn("inline-flex gap-0.5 text-gold", className)}
      role="img"
      aria-label={`Rated ${rating} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden className={i < full ? "" : "opacity-30"}>
          ★
        </span>
      ))}
    </span>
  );
}
