"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

/**
 * Scroll-triggered entrance for a block of content.
 * Children are visible by default; GSAP only animates when JS runs and the
 * user has not asked for reduced motion.
 */
export function Reveal({
  children,
  className,
  y = 30,
  delay = 0,
  stagger = 0,
  start = "top 85%",
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  stagger?: number;
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const targets =
        stagger > 0 && node.children.length > 1
          ? Array.from(node.children)
          : node;
      gsap.from(targets, {
        y,
        opacity: 0,
        duration: 0.85,
        delay,
        stagger,
        ease: "power3.out",
        scrollTrigger: { trigger: node, start, once: true },
      });
    }, ref);

    return () => ctx.revert();
  }, [y, delay, stagger, start]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
