"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // headline / copy reveal
      gsap.from("[data-hero-copy] > *", {
        y: 34,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.15,
      });

      // artwork drifts in
      gsap.from("[data-hero-art]", {
        scale: 1.06,
        opacity: 0,
        duration: 1.4,
        ease: "power2.out",
        delay: 0.1,
      });

      // floating motifs — gentle perpetual drift
      gsap.utils.toArray<HTMLElement>("[data-float]").forEach((el, i) => {
        gsap.to(el, {
          y: i % 2 === 0 ? -16 : 14,
          rotation: i % 2 === 0 ? 8 : -7,
          duration: 2.6 + i * 0.45,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

      // parallax on scroll
      gsap.to("[data-hero-art]", {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: node,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-peach">
      <div data-hero-art className="absolute inset-0">
        <Image
          src="/prints/hero.svg"
          alt="Hand-drawn pyjama prints layered as fabric swatches"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-peach via-peach/80 to-transparent lg:to-transparent" />
      </div>

      {/* floating motifs */}
      <Image
        src="/prints/motif-star-ink.svg"
        alt=""
        aria-hidden
        width={64}
        height={64}
        unoptimized
        data-float
        className="absolute top-[16%] right-[42%] hidden opacity-90 lg:block"
      />
      <Image
        src="/prints/motif-moon-ink.svg"
        alt=""
        aria-hidden
        width={54}
        height={54}
        unoptimized
        data-float
        className="absolute bottom-[22%] right-[38%] hidden opacity-90 lg:block"
      />
      <Image
        src="/prints/motif-flower-ink.svg"
        alt=""
        aria-hidden
        width={72}
        height={72}
        unoptimized
        data-float
        className="absolute bottom-[16%] left-[44%] hidden opacity-80 md:block"
      />

      <div className="relative mx-auto flex min-h-[76vh] max-w-[1400px] items-center px-6 py-20 lg:min-h-[84vh]">
        <div data-hero-copy className="max-w-xl">
          <p className="mb-5 flex items-center gap-3 text-[12px] font-semibold tracking-[0.22em] text-ink/75 uppercase">
            <span className="h-px w-10 bg-ink/50" aria-hidden />
            British boutique pyjamas · est. 2003
          </p>
          <h1 className="text-balance font-heading text-display-1 text-ink">
            Sleep in beautiful prints
          </h1>
          <p className="mt-6 max-w-md text-lead text-ink/85">
            Hand-drawn prints on super-soft cotton — pyjamas, nightwear and matching
            sets designed in London to make the cosy feel special.
          </p>
          <div className="mt-9 flex flex-wrap gap-3.5">
            <Link
              href="/collections/new-in"
              className="bg-ink px-8 py-4 text-[13px] font-semibold tracking-[0.16em] text-cream uppercase transition-colors hover:bg-peach-deep hover:text-ink"
            >
              Shop new in
            </Link>
            <Link
              href="/collections/womens"
              className="border-2 border-ink px-8 py-4 text-[13px] font-semibold tracking-[0.16em] text-ink uppercase transition-colors hover:bg-ink hover:text-cream"
            >
              Explore pyjamas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
