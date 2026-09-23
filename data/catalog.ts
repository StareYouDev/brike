/**
 * Single source of truth for the shop's mock catalog.
 * Also consumed by scripts/generate-prints.ts to render every print as SVG art.
 * Pure data + types only — no imports (it is executed directly by Node).
 */

export type PatternType =
  | "stripe"
  | "gingham"
  | "check"
  | "dot"
  | "floral"
  | "celestial"
  | "harlequin"
  | "leaf"
  | "snow";

export type PaletteName =
  | "navy"
  | "blush"
  | "sage"
  | "cherry"
  | "butter"
  | "lilac"
  | "teal"
  | "rust"
  | "ink"
  | "sky"
  | "olive";

export interface Print {
  type: PatternType;
  /** Colorway shown as the primary product image */
  a: PaletteName;
  /** Alternate colorway shown on hover (the "second image" swap) */
  b: PaletteName;
}

export interface Product {
  slug: string;
  name: string;
  price: number;
  compareAt?: number;
  badge?: "New" | "Best Seller" | "Sale" | "Low Stock";
  collections: string[];
  style: string;
  fabric: string;
  sizes: string[];
  colorways: string[];
  description: string;
  details: string[];
  print: Print;
  rating: number;
  reviews: number;
  featured?: boolean;
}

export interface Collection {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  print: Print;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface MegaMenu {
  label: string;
  href: string;
  columns: { heading: string; links: NavLink[] }[];
}

export const site = {
  name: "BRIKE",
  tagline: "British boutique pyjamas, nightwear & home",
  description:
    "BRIKE is a British boutique sleepwear house designing beautiful hand-drawn prints to brighten up the everyday — print-led design on super-soft fabrics.",
  email: "hello@brike.co.uk",
  phone: "+44 (0)20 7946 0958",
  address: "Unit 4, brick Wharf, London E14 9QY, United Kingdom",
  currency: "£",
  freeShippingThreshold: 60,
  standardDelivery: 3.95,
  charityPercent: 20,
};

export const announcements = [
  "£3.95 standard UK delivery — free on orders over £60",
  `We donate ${site.charityPercent}% of our Kids Collection profits to our chosen charity`,
  "New festive prints have landed — shop the winter edit",
  "Designed in London · Printed on super-soft cotton",
];

export const collections: Collection[] = [
  {
    slug: "new-in",
    title: "New In",
    shortTitle: "New In",
    description:
      "The latest prints fresh off the drawing table — brand-new pyjama sets, nightdresses and festive additions.",
    print: { type: "celestial", a: "navy", b: "blush" },
  },
  {
    slug: "best-sellers",
    title: "Best Sellers",
    shortTitle: "Best Sellers",
    description:
      "The prints you keep coming back for — our most-loved pyjamas, tried, tested and re-ordered.",
    print: { type: "floral", a: "blush", b: "navy" },
  },
  {
    slug: "womens",
    title: "Women's Pyjamas",
    shortTitle: "Womens",
    description:
      "Traditional long pyjamas, oversized sets, capri lengths, nightdresses and robes in hand-drawn prints.",
    print: { type: "floral", a: "sage", b: "blush" },
  },
  {
    slug: "kids",
    title: "Kids Pyjamas",
    shortTitle: "Kids",
    description:
      "Playful prints and proper pyjamas for tiny nibs — soft brushed cotton for cosy bedtimes and slow Sundays.",
    print: { type: "celestial", a: "lilac", b: "teal" },
  },
  {
    slug: "mens",
    title: "Men's Pyjamas",
    shortTitle: "Mens",
    description:
      "Classic cuts, brushed cotton and quiet confidence — men's pyjamas with our signature print-led twist.",
    print: { type: "stripe", a: "navy", b: "olive" },
  },
  {
    slug: "festive",
    title: "The Festive Edit",
    shortTitle: "Festive",
    description:
      "Winter prints, matching family sets and brushed-cotton warmth for the slow mornings of the season.",
    print: { type: "harlequin", a: "cherry", b: "sage" },
  },
  {
    slug: "matching",
    title: "Matching Pyjamas",
    shortTitle: "Matching",
    description:
      "One print, the whole family — matching sets designed to be worn, photographed and remembered.",
    print: { type: "check", a: "blush", b: "navy" },
  },
];

const womensSizes = ["XS", "S", "M", "L", "XL"];
const kidsSizes = ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y"];
const mensSizes = ["S", "M", "L", "XL", "XXL"];

export const products: Product[] = [
  {
    slug: "celestial-harlequin-pyjama-set",
    name: "Celestial Harlequin Pyjama Set",
    price: 85,
    badge: "Best Seller",
    collections: ["new-in", "best-sellers", "womens"],
    style: "Traditional Long",
    fabric: "Cotton",
    sizes: womensSizes,
    colorways: ["Midnight navy multi", "Blush multi"],
    description:
      "Our signature sun, moon and stars scattered across a harlequin check — a playful celestial print on crisp, breathable cotton that only gets softer with every wash.",
    details: [
      "100% combed cotton, 140gsm",
      "Button-through front with classic collar",
      "Elasticated waist with drawstring",
      "Printed, cut and finished in Portugal",
    ],
    print: { type: "celestial", a: "navy", b: "blush" },
    rating: 4.9,
    reviews: 214,
    featured: true,
  },
  {
    slug: "vintage-rose-cotton-pyjama-set",
    name: "Vintage Rose Cotton Pyjama Set",
    price: 78,
    collections: ["best-sellers", "womens"],
    style: "Traditional Long",
    fabric: "Cotton",
    sizes: womensSizes,
    colorways: ["Blush rose multi", "Navy rose multi"],
    description:
      "Ditsy roses drawn by hand and repeated all over — a romantic, vintage-feel print on our softest cotton for slow, flower-filled mornings.",
    details: [
      "100% combed cotton, 140gsm",
      "Piped pockets and button cuffs",
      "Elasticated waist with drawstring",
      "Machine washable at 30°",
    ],
    print: { type: "floral", a: "blush", b: "navy" },
    rating: 4.8,
    reviews: 168,
    featured: true,
  },
  {
    slug: "midnight-gingham-pyjama-set",
    name: "Midnight Gingham Pyjama Set",
    price: 82,
    collections: ["womens"],
    style: "Traditional Long",
    fabric: "Brushed Cotton",
    sizes: womensSizes,
    colorways: ["Midnight navy", "Cherry red"],
    description:
      "Brushed cotton on the inside, bold gingham on the outside — a winter-weight set that feels like a hug at bedtime.",
    details: [
      "Brushed cotton flannel, 170gsm",
      "Cosy brushed interior",
      "Two front patch pockets",
      "Elasticated waist with drawstring",
    ],
    print: { type: "gingham", a: "navy", b: "cherry" },
    rating: 4.9,
    reviews: 132,
  },
  {
    slug: "blush-stripe-capri-set",
    name: "Blush Stripe Capri Pyjama Set",
    price: 72,
    badge: "New",
    collections: ["new-in", "womens"],
    style: "Capri",
    fabric: "Cotton Voile",
    sizes: womensSizes,
    colorways: ["Blush stripe", "Sky stripe"],
    description:
      "Featherweight cotton voile with candy stripes and a cropped capri trouser — made for warm nights and open windows.",
    details: [
      "100% cotton voile, ultra-light",
      "Capri-length tapered trouser",
      "Shell buttons and piped edges",
      "Elasticated waist",
    ],
    print: { type: "stripe", a: "blush", b: "sky" },
    rating: 4.7,
    reviews: 89,
    featured: true,
  },
  {
    slug: "ditsy-meadow-voile-pyjama-set",
    name: "Ditsy Meadow Voile Pyjama Set",
    price: 90,
    collections: ["womens"],
    style: "Traditional Long",
    fabric: "Cotton Voile",
    sizes: womensSizes,
    colorways: ["Sage meadow", "Cream meadow"],
    description:
      "A meadow of hand-drawn wildflowers drifting across airy cotton voile — our most delicate print, cut into our classic long silhouette.",
    details: [
      "100% cotton voile, 90gsm",
      "Button-through shirt with collar",
      "Straight-leg trouser, elasticated waist",
      "Printed in small batches",
    ],
    print: { type: "floral", a: "sage", b: "blush" },
    rating: 5,
    reviews: 76,
  },
  {
    slug: "buttercup-check-oversized-set",
    name: "Buttercup Check Oversized Set",
    price: 88,
    badge: "New",
    collections: ["new-in", "womens"],
    style: "Oversized",
    fabric: "Cotton Gauze",
    sizes: womensSizes,
    colorways: ["Buttercup yellow", "Ink black"],
    description:
      "Double-layer cotton gauze in a sunny window-pane check, cut oversized for that just-stole-his-pyjamas feeling.",
    details: [
      "Double gauze cotton, 120gsm",
      "Relaxed oversized fit",
      "Drop shoulder, roomy sleeve",
      "Gets softer with every wash",
    ],
    print: { type: "check", a: "butter", b: "ink" },
    rating: 4.8,
    reviews: 104,
    featured: true,
  },
  {
    slug: "scarlet-dots-nightdress",
    name: "Scarlet Dots Nightdress",
    price: 65,
    compareAt: 78,
    badge: "Sale",
    collections: ["best-sellers", "womens"],
    style: "Nightdress",
    fabric: "Cotton",
    sizes: womensSizes,
    colorways: ["Scarlet spot", "Navy spot"],
    description:
      "Playful polka dots on a breezy A-line nightdress with a scalloped hem — easy, pretty, effortless.",
    details: [
      "100% combed cotton",
      "A-line cut with scalloped hem",
      "Adjustable shoulder straps",
      "Knee-length fit",
    ],
    print: { type: "dot", a: "cherry", b: "navy" },
    rating: 4.7,
    reviews: 98,
  },
  {
    slug: "hummingbird-satin-pyjama-set",
    name: "Hummingbird Satin Pyjama Set",
    price: 96,
    badge: "Best Seller",
    collections: ["new-in", "best-sellers", "womens"],
    style: "Traditional Long",
    fabric: "Satin",
    sizes: womensSizes,
    colorways: ["Teal hummingbird", "Ink hummingbird"],
    description:
      "Cool-to-the-touch satin strewn with hummingbirds and hidden blossoms — our special-occasion set for midwinter parties and slow recovery mornings.",
    details: [
      "Recycled satin weave",
      "Contrast piping in cream",
      "Shell buttons, chest pocket",
      "Elasticated waist with drawstring",
    ],
    print: { type: "leaf", a: "teal", b: "ink" },
    rating: 4.9,
    reviews: 187,
    featured: true,
  },
  {
    slug: "harbour-stripe-mens-pyjamas",
    name: "Harbour Stripe Men's Pyjamas",
    price: 95,
    collections: ["best-sellers", "mens"],
    style: "Traditional Long",
    fabric: "Brushed Cotton",
    sizes: mensSizes,
    colorways: ["Harbour navy", "Rust navy"],
    description:
      "Nautical stripes on brushed cotton flannel — a proper men's pyjama with a collared shirt, chest pocket and zero fuss.",
    details: [
      "Brushed cotton flannel, 170gsm",
      "Button-through collar shirt",
      "Chest pocket, side pockets",
      "Elasticated waist with drawstring",
    ],
    print: { type: "stripe", a: "navy", b: "rust" },
    rating: 4.8,
    reviews: 141,
    featured: true,
  },
  {
    slug: "olive-check-mens-pyjamas",
    name: "Olive Check Men's Pyjamas",
    price: 95,
    collections: ["mens"],
    style: "Traditional Long",
    fabric: "Cotton",
    sizes: mensSizes,
    colorways: ["Olive check", "Sky check"],
    description:
      "An olive window-pane check drawn from a favourite old dressing gown — crisp cotton, relaxed fit, quietly handsome.",
    details: [
      "100% combed cotton, 150gsm",
      "Classic collar, button cuffs",
      "Two side pockets",
      "Machine washable at 30°",
    ],
    print: { type: "check", a: "olive", b: "sky" },
    rating: 4.6,
    reviews: 72,
  },
  {
    slug: "nocturne-celestial-mens-pyjamas",
    name: "Nocturne Celestial Men's Pyjamas",
    price: 98,
    badge: "New",
    collections: ["new-in", "mens"],
    style: "Traditional Long",
    fabric: "Satin",
    sizes: mensSizes,
    colorways: ["Ink celestial", "Teal celestial"],
    description:
      "Our celestial harlequin reimagined in ink — a fluid satin set named for late-night records and one more chapter.",
    details: [
      "Recycled satin weave",
      "Contrast piping in peach",
      "Shell buttons, chest pocket",
      "Relaxed straight fit",
    ],
    print: { type: "celestial", a: "ink", b: "teal" },
    rating: 4.9,
    reviews: 63,
    featured: true,
  },
  {
    slug: "star-trail-kids-pyjamas",
    name: "Star Trail Kids Pyjamas",
    price: 42,
    collections: ["best-sellers", "kids"],
    style: "Traditional Long",
    fabric: "Brushed Cotton",
    sizes: kidsSizes,
    colorways: ["Lilac star trail", "Navy star trail"],
    description:
      "A trail of stars, moons and tiny planets across brushed cotton — cosy enough to make bedtime the best part of the day.",
    details: [
      "Brushed cotton flannel",
      "Button-through top with collar",
      "Elasticated waist, no scratchy labels",
      "Shrink-resistant finish",
    ],
    print: { type: "celestial", a: "lilac", b: "navy" },
    rating: 4.9,
    reviews: 256,
    featured: true,
  },
  {
    slug: "rainbow-check-kids-pyjamas",
    name: "Rainbow Check Kids Pyjamas",
    price: 40,
    collections: ["kids"],
    style: "Short",
    fabric: "Cotton",
    sizes: kidsSizes,
    colorways: ["Teal rainbow", "Cherry rainbow"],
    description:
      "Short sleeves, short trousers, maximum colour — a bright check for wriggly sleepers and summer bedtimes.",
    details: [
      "100% combed cotton",
      "Short-sleeve shirt and short",
      "Elasticated waist",
      "Colour-fast print",
    ],
    print: { type: "check", a: "teal", b: "cherry" },
    rating: 4.7,
    reviews: 118,
  },
  {
    slug: "little-bloom-kids-pyjamas",
    name: "Little Bloom Kids Pyjamas",
    price: 42,
    badge: "New",
    collections: ["new-in", "kids"],
    style: "Traditional Long",
    fabric: "Cotton",
    sizes: kidsSizes,
    colorways: ["Blush little bloom", "Sage little bloom"],
    description:
      "Miniature roses the size of confetti — a soft cotton set for the littlest nibs, with proper pockets for treasure collecting.",
    details: [
      "100% combed cotton, 140gsm",
      "Two patch pockets",
      "Elasticated waist",
      "Machine washable at 30°",
    ],
    print: { type: "floral", a: "blush", b: "sage" },
    rating: 4.8,
    reviews: 91,
  },
  {
    slug: "snowfall-kids-pyjama-set",
    name: "Snowfall Kids Pyjama Set",
    price: 45,
    collections: ["festive", "kids"],
    style: "Traditional Long",
    fabric: "Brushed Cotton",
    sizes: kidsSizes,
    colorways: ["Sky snowfall", "Cherry snowfall"],
    description:
      "Hand-drawn snowflakes drifting over brushed cotton — the Christmas-morning pyjamas, unwrapped the night before, of course.",
    details: [
      "Brushed cotton flannel",
      "Button-through front",
      "Elasticated waist",
      "Festive gift-ready packaging",
    ],
    print: { type: "snow", a: "sky", b: "cherry" },
    rating: 4.9,
    reviews: 147,
  },
  {
    slug: "festive-harlequin-pyjama-set",
    name: "Festive Harlequin Pyjama Set",
    price: 85,
    badge: "Best Seller",
    collections: ["new-in", "best-sellers", "festive"],
    style: "Traditional Long",
    fabric: "Brushed Cotton",
    sizes: womensSizes,
    colorways: ["Cherry harlequin", "Sage harlequin"],
    description:
      "Our harlequin print dressed in festive cherry and gold — brushed cotton for cold floors, slow mornings and paper-opening at eight.",
    details: [
      "Brushed cotton flannel, 170gsm",
      "Contrast piping in gold",
      "Button-through collar shirt",
      "Elasticated waist with drawstring",
    ],
    print: { type: "harlequin", a: "cherry", b: "sage" },
    rating: 4.9,
    reviews: 176,
    featured: true,
  },
  {
    slug: "cosy-gingham-festive-pyjamas",
    name: "Cosy Gingham Festive Pyjamas",
    price: 84,
    collections: ["festive"],
    style: "Traditional Long",
    fabric: "Brushed Cotton",
    sizes: womensSizes,
    colorways: ["Cherry gingham", "Sage gingham"],
    description:
      "Picnic gabbage in winter colours — a brushed-cotton set that works from December right through to spring.",
    details: [
      "Brushed cotton flannel",
      "Chest pocket with contrast stitch",
      "Elasticated waist with drawstring",
      "Unisex relaxed fit",
    ],
    print: { type: "gingham", a: "cherry", b: "sage" },
    rating: 4.8,
    reviews: 84,
  },
  {
    slug: "winter-leaf-nightshirt",
    name: "Winter Leaf Nightshirt",
    price: 88,
    compareAt: 105,
    badge: "Sale",
    collections: ["festive", "womens"],
    style: "Nightdress",
    fabric: "Cotton Gauze",
    sizes: womensSizes,
    colorways: ["Rust winter leaf", "Ink winter leaf"],
    description:
      "A long, lazy nightshirt in double gauze, printed with falling leaves — for reading in bed long past the alarm.",
    details: [
      "Double gauze cotton",
      "Knee-length, side splits",
      "Button placket, chest pocket",
      "Relaxed unisex fit",
    ],
    print: { type: "leaf", a: "rust", b: "ink" },
    rating: 4.7,
    reviews: 67,
  },
  {
    slug: "family-star-matching-set",
    name: "Family Star Matching Set",
    price: 44,
    badge: "New",
    collections: ["new-in", "matching", "festive"],
    style: "Matching Set",
    fabric: "Cotton",
    sizes: [...womensSizes, ...kidsSizes],
    colorways: ["Midnight star", "Blush star"],
    description:
      "One star print, every size from 2 to XL — matching sets for the whole family, made for the photograph and kept for years.",
    details: [
      "100% combed cotton",
      "Sizes for adults and children",
      "Button-through top, elasticated waist",
      "Available as singles or pairs",
    ],
    print: { type: "celestial", a: "navy", b: "blush" },
    rating: 4.9,
    reviews: 112,
    featured: true,
  },
  {
    slug: "family-check-matching-set",
    name: "Family Check Matching Set",
    price: 46,
    collections: ["matching"],
    style: "Matching Set",
    fabric: "Brushed Cotton",
    sizes: [...womensSizes, ...kidsSizes],
    colorways: ["Blush check", "Navy check"],
    description:
      "The window-pane check in blush and navy, sized for everyone — Christmasses, birthdays and all the ordinary Tuesdays.",
    details: [
      "Brushed cotton flannel",
      "Sizes for adults and children",
      "Contrast piping",
      "Gift box available",
    ],
    print: { type: "check", a: "blush", b: "navy" },
    rating: 4.8,
    reviews: 74,
  },
];

export const mainNavigation: MegaMenu[] = [
  {
    label: "Festive Edit",
    href: "/collections/festive",
    columns: [],
  },
  {
    label: "New In",
    href: "/collections/new-in",
    columns: [
      {
        heading: "Newest Releases",
        links: [
          { label: "New In", href: "/collections/new-in" },
          { label: "Festive Collection", href: "/collections/festive" },
          { label: "Matching Pyjamas", href: "/collections/matching" },
          { label: "Best Sellers", href: "/collections/best-sellers" },
        ],
      },
      {
        heading: "Shop by Category",
        links: [
          { label: "Women's New In", href: "/collections/new-in?filter=womens" },
          { label: "Kids New In", href: "/collections/new-in?filter=kids" },
          { label: "Men's New In", href: "/collections/new-in?filter=mens" },
        ],
      },
    ],
  },
  {
    label: "Womens",
    href: "/collections/womens",
    columns: [
      {
        heading: "Shop",
        links: [
          { label: "New In", href: "/collections/new-in" },
          { label: "Best Sellers", href: "/collections/best-sellers" },
          { label: "Shop All Pyjama Sets", href: "/collections/womens" },
        ],
      },
      {
        heading: "Shop by Style",
        links: [
          { label: "Traditional Long Pyjamas", href: "/collections/womens?style=Traditional+Long" },
          { label: "Oversized Pyjamas", href: "/collections/womens?style=Oversized" },
          { label: "Capri Pyjamas", href: "/collections/womens?style=Capri" },
          { label: "Nightdresses & Shirts", href: "/collections/womens?style=Nightdress" },
        ],
      },
      {
        heading: "Shop by Fabric",
        links: [
          { label: "Cotton", href: "/collections/womens?fabric=Cotton" },
          { label: "Brushed Cotton", href: "/collections/womens?fabric=Brushed+Cotton" },
          { label: "Cotton Voile", href: "/collections/womens?fabric=Cotton+Voile" },
          { label: "Cotton Gauze", href: "/collections/womens?fabric=Cotton+Gauze" },
          { label: "Satin", href: "/collections/womens?fabric=Satin" },
        ],
      },
    ],
  },
  {
    label: "Kids",
    href: "/collections/kids",
    columns: [
      {
        heading: "Shop",
        links: [
          { label: "Kids New In", href: "/collections/new-in" },
          { label: "Kids Best Sellers", href: "/collections/best-sellers" },
          { label: "Shop All Kids Pyjamas", href: "/collections/kids" },
          { label: "Matching Family Sets", href: "/collections/matching" },
        ],
      },
      {
        heading: "Shop by Age",
        links: [
          { label: "2 - 3 Years", href: "/collections/kids" },
          { label: "4 - 5 Years", href: "/collections/kids" },
          { label: "6 - 7 Years", href: "/collections/kids" },
          { label: "8 - 11 Years", href: "/collections/kids" },
        ],
      },
    ],
  },
  {
    label: "Mens",
    href: "/collections/mens",
    columns: [
      {
        heading: "Shop",
        links: [
          { label: "New In", href: "/collections/new-in" },
          { label: "Shop All Men's Pyjamas", href: "/collections/mens" },
          { label: "Matching Family Sets", href: "/collections/matching" },
        ],
      },
      {
        heading: "Shop by Fabric",
        links: [
          { label: "Brushed Cotton", href: "/collections/mens?fabric=Brushed+Cotton" },
          { label: "Cotton", href: "/collections/mens?fabric=Cotton" },
          { label: "Satin", href: "/collections/mens?fabric=Satin" },
        ],
      },
    ],
  },
  {
    label: "Our Story",
    href: "/about",
    columns: [],
  },
];

export const reviews = [
  {
    quote:
      "The fabric is genuinely the softest pyjamas I own, and the print is even prettier in person. I've bought three sets now.",
    name: "Harriet M.",
    product: "Celestial Harlequin Pyjama Set",
    rating: 5,
  },
  {
    quote:
      "Bought the matching sets for the whole family at Christmas — the kids refused to take them off. Proper quality stitching too.",
    name: "Daniel O.",
    product: "Family Star Matching Set",
    rating: 5,
  },
  {
    quote:
      "Light as air, beautifully packed, and the meadow print makes me absurdly happy. Delivery to Scotland took two days.",
    name: "Fiona C.",
    product: "Ditsy Meadow Voile Pyjama Set",
    rating: 5,
  },
];

export const fabricFilters = [
  "Cotton",
  "Brushed Cotton",
  "Cotton Voile",
  "Cotton Gauze",
  "Satin",
];

export const styleFilters = [
  "Traditional Long",
  "Oversized",
  "Capri",
  "Short",
  "Nightdress",
  "Matching Set",
];

/* ---------- helpers ---------- */

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getCollection(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}

export function getCollectionProducts(slug: string): Product[] {
  return products.filter((p) => p.collections.includes(slug));
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const sameCollection = products.filter(
    (p) =>
      p.slug !== product.slug &&
      p.collections.some((c) => product.collections.includes(c)),
  );
  return sameCollection.slice(0, limit);
}

export function formatPrice(value: number): string {
  return `${site.currency}${value.toFixed(2)}`;
}
