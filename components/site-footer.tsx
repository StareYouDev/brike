import Link from "next/link";
import { site } from "@/data/catalog";
import { getAllCollections } from "@/lib/queries";
import { collectionImage } from "@/lib/images";
import { NewsletterForm } from "@/components/newsletter-form";

type IconProps = { size?: number };

function InstagramIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.5 3.5h-1.8A3.7 3.7 0 0 0 9 7.2v2.3H6.6v3.4H9V21h3.6v-8.1h2.5l.6-3.4h-3.1V7.4c0-.6.4-1 1-1h2.3z" />
    </svg>
  );
}

function YoutubeIcon({ size = 21 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.2 9.4v5.2l4.6-2.6z" fill="currentColor" stroke="none" />
    </svg>
  );
}

async function shopLinks() {
  const collections = await getAllCollections();
  return collections.slice(0, 6).map((c) => ({
    label: c.shortTitle,
    href: `/collections/${c.slug}`,
    image: collectionImage(c),
  }));
}

const helpLinks = [
  { label: "Delivery & Returns", href: "/contact" },
  { label: "Size Guide", href: "/size-guide" },
  { label: "Contact Us", href: "/contact" },
  { label: "Our Story", href: "/about" },
];

const aboutLinks = [
  { label: "Our Story", href: "/about" },
  { label: "The Charity", href: "/about" },
  { label: "Fabric Care", href: "/about" },
  { label: "Stockists", href: "/about" },
];

function LinkColumn({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="mb-4 text-[11.5px] font-semibold tracking-[0.16em] text-ink/70 uppercase">
        {heading}
      </p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-[14.5px] transition-opacity hover:opacity-60">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  const shop = await shopLinks();
  return (
    <footer className="bg-peach text-ink">
      <div className="mx-auto max-w-[1400px] px-6 pt-16 pb-10">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <p className="font-logo text-[30px] leading-none">BRIKE</p>
            <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-ink/85">
              {site.description}
            </p>
            <div className="mt-6 flex gap-4">
              <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-60">
                <InstagramIcon />
              </a>
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-60">
                <FacebookIcon />
              </a>
              <a href="https://youtube.com" aria-label="YouTube" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-60">
                <YoutubeIcon />
              </a>
            </div>
          </div>
          <LinkColumn heading="Shop" links={shop} />
          <LinkColumn heading="Help" links={helpLinks} />
          <LinkColumn heading="About" links={aboutLinks} />
        </div>

        <div className="mt-14 border-t border-ink/25 pt-8">
          <p className="mb-3 text-[11.5px] font-semibold tracking-[0.16em] text-ink/70 uppercase">
            Join the nibs club
          </p>
          <NewsletterForm />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink/25 pt-6 text-[13px] text-ink/75 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name} · Registered in England &amp; Wales
          </p>
          <p className="flex flex-wrap gap-x-5 gap-y-1">
            <span>{site.email}</span>
            <span>{site.phone}</span>
            <span>Visa · Mastercard · Amex · PayPal</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
