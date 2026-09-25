"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import type { Colorway } from "@/data/catalog";
import { cn } from "@/lib/utils";

interface ColorwayContextValue {
  colorways: Colorway[];
  /** Index of the selected colour (drives the swatch ring + cart line). */
  index: number;
  /** Which product image the gallery is showing. */
  hero: "a" | "b";
  /** Selecting a colour also swaps the gallery to that colour's image. */
  select: (index: number) => void;
  /** Direct gallery access via the thumbnails. */
  showImage: (key: "a" | "b") => void;
}

const ColorwayContext = createContext<ColorwayContextValue | null>(null);

export function useColorway(): ColorwayContextValue {
  const ctx = useContext(ColorwayContext);
  if (!ctx) {
    throw new Error("useColorway must be used inside a ColorwayProvider");
  }
  return ctx;
}

/**
 * Shared state between the PDP gallery and the buy panel: tapping a colour
 * swatch swaps the hero image to that colour's photo, and tapping a
 * thumbnail highlights the colour that shows it. Lives above the server-
 * rendered details column, which passes through as children untouched.
 */
export function ColorwayProvider({
  colorways,
  children,
}: {
  colorways: Colorway[];
  children: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [hero, setHero] = useState<"a" | "b">(colorways[0]?.image ?? "a");

  const value = useMemo<ColorwayContextValue>(
    () => ({
      colorways,
      index,
      hero,
      select: (next: number) => {
        const colorway = colorways[next];
        if (!colorway) return;
        setIndex(next);
        setHero(colorway.image);
      },
      showImage: (key: "a" | "b") => setHero(key),
    }),
    [colorways, index, hero],
  );

  return (
    <ColorwayContext.Provider value={value}>
      {children}
    </ColorwayContext.Provider>
  );
}

/**
 * PDP gallery: the hero image follows the selected colour, and the two
 * thumbnails double as a direct image switcher (clicking one highlights the
 * colour that uses it when there is one).
 */
export function ProductGallery({
  name,
  badge,
  images,
}: {
  name: string;
  badge?: string | null;
  images: { a: string; b: string };
}) {
  const { colorways, index, hero, select, showImage } = useColorway();
  const selected = colorways[index];
  const alt =
    selected && selected.image === hero
      ? `${name} — ${selected.name}`
      : `${name} — alternate view`;

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse">
      <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-meta">
        <Image
          key={images[hero]}
          src={images[hero]}
          alt={alt}
          fill
          priority
          unoptimized
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        {badge ? (
          <span className="absolute top-4 left-4 rounded-full bg-ink px-3.5 py-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-cream uppercase">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex gap-3 lg:flex-col">
        {(["a", "b"] as const).map((key, i) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              const colorway = colorways.findIndex((c) => c.image === key);
              if (colorway >= 0) select(colorway);
              else showImage(key);
            }}
            aria-label={`Show ${i === 0 ? "first" : "second"} image`}
            aria-pressed={hero === key}
            className={cn(
              "relative aspect-square w-1/3 shrink-0 overflow-hidden bg-meta outline-none transition-all lg:aspect-[4/5] lg:w-24",
              hero === key
                ? "ring-2 ring-ink ring-offset-2 ring-offset-cream"
                : "hover:opacity-80",
            )}
          >
            <Image
              src={images[key]}
              alt=""
              fill
              unoptimized
              sizes="96px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
