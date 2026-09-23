import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatPrice, type Product } from "@/data/catalog";

const badgeStyles: Record<string, string> = {
  New: "bg-ink text-cream",
  "Best Seller": "bg-cream text-ink border border-ink/15",
  Sale: "bg-sale text-white",
  "Low Stock": "bg-gold text-ink",
};

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: Product;
  priority?: boolean;
  className?: string;
}) {
  const onSale = typeof product.compareAt === "number";

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-meta"
        aria-label={product.name}
      >
        <Image
          src={`/prints/${product.slug}-a.svg`}
          alt={`${product.name} in ${product.colorways[0]}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          unoptimized
          className="object-cover transition-opacity duration-500 group-hover:opacity-0"
        />
        <Image
          src={`/prints/${product.slug}-b.svg`}
          alt={`${product.name} in ${product.colorways[1] ?? product.colorways[0]}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized
          className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
        {product.badge ? (
          <span
            className={cn(
              "absolute top-3 left-3 rounded-full px-3 py-1 text-[10.5px] font-semibold tracking-[0.12em] uppercase",
              badgeStyles[product.badge],
            )}
          >
            {product.badge}
          </span>
        ) : null}
        <span className="absolute inset-x-3 bottom-3 translate-y-2 bg-ink/90 py-2.5 text-center text-[12px] font-semibold tracking-[0.14em] text-cream uppercase opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Quick view
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-1 pt-3.5 pb-1">
        <Link
          href={`/products/${product.slug}`}
          className="text-[15px] leading-snug font-medium text-ink transition-colors hover:text-peach-deep"
        >
          {product.name}
        </Link>
        <p className="text-[12.5px] tracking-[0.06em] text-muted-foreground uppercase">
          {product.fabric} · {product.style}
        </p>
        <div className="mt-auto flex items-baseline gap-2 pt-1.5">
          <span className={cn("text-[15px] font-semibold", onSale && "text-sale")}>
            {formatPrice(product.price)}
          </span>
          {onSale ? (
            <span className="text-[13px] text-muted-foreground line-through">
              {formatPrice(product.compareAt!)}
            </span>
          ) : null}
          <span className="ml-auto text-[12px] text-muted-foreground">
            ★ {product.rating.toFixed(1)} ({product.reviews})
          </span>
        </div>
      </div>
    </article>
  );
}
