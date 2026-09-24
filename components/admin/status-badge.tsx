import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  isOrderStatus,
  STATUS_LABELS,
} from "@/lib/admin-form";

const STATUS_STYLES = {
  pending: "border-gold/50 bg-gold/15 text-ink",
  confirmed: "border-navy/30 bg-navy/10 text-navy",
  shipped: "border-peach-deep/40 bg-peach-deep/10 text-ink",
  delivered: "border-forest/40 bg-forest/10 text-forest",
  cancelled: "border-sale/30 bg-sale/10 text-sale",
} as const;

/** Semantic colour chip for cash-on-delivery order statuses. */
export function StatusBadge({ status }: { status: string }) {
  const known = isOrderStatus(status);
  return (
    <Badge
      variant="outline"
      className={cn(known && STATUS_STYLES[status])}
    >
      {known ? STATUS_LABELS[status] : status}
    </Badge>
  );
}
