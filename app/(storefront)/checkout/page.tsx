import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Cash-on-delivery checkout for BRIKE pyjamas — pay the courier when your order arrives.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-20">
      <Breadcrumb items={[{ label: "Checkout" }]} />

      <div className="mt-8">
        <p className="mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          <span className="h-px w-8 bg-line" aria-hidden />
          Cash on delivery
        </p>
        <h1 className="text-balance font-heading text-display-3">Checkout</h1>
        <p className="mt-4 max-w-lg text-[16px] text-foreground/80">
          Tell us where to deliver and hand the courier the cash when your
          order lands — no cards, no online payment, no account needed.
        </p>
      </div>

      <div className="mt-10">
        <CheckoutForm />
      </div>
    </div>
  );
}
