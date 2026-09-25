"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Colorway } from "@/data/catalog";
import type { ActionState } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";
import {
  BADGES,
  PALETTE_NAMES,
  PATTERN_TYPES,
  SIZE_TOKENS,
} from "@/lib/admin-form";

/** Plain shape of an existing product row (passed from the server page). */
export interface ProductFormInitial {
  id: string;
  slug: string;
  name: string;
  pricePence: number;
  compareAtPence: number | null;
  badge: string | null;
  style: string;
  fabric: string;
  description: string;
  details: string[];
  colorways: Colorway[];
  sizes: string[];
  printType: string;
  printA: string;
  printB: string;
  imageA: string | null;
  imageB: string | null;
  rating: number;
  reviews: number;
  featured: boolean;
  sortOrder: number;
  collectionIds: string[];
  /** Tracked sizes only (blank form field = untracked). */
  stock: Record<string, number>;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-[12px] text-destructive">{messages[0]}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** One editable colour row in the product form. */
type ColorwayRow = { name: string; hex: string; image: "a" | "b" };

/**
 * Tap-to-upload image card: the whole preview area is a label for the hidden
 * file input, so tapping it opens the picker; a chosen file previews locally
 * (over the stored image) until the save lands it in Blob storage. The path
 * input stays for pasting an existing URL.
 */
function ImageSlot({
  label,
  hint,
  fileField,
  pathField,
  current,
  errors,
}: {
  label: string;
  hint: string;
  fileField: "imageA" | "imageB";
  pathField: "imageAPath" | "imageBPath";
  current: string | null;
  errors?: string[];
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : null;
    setPreview(previewRef.current);
  };

  const shown = preview ?? current;

  return (
    <div className="space-y-2">
      <Label htmlFor={pathField}>{label}</Label>
      <label
        htmlFor={`${fileField}-file`}
        className="group relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-meta transition-colors hover:border-ink/40 focus-within:border-ink/60"
      >
        {shown ? (
          preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <Image
              src={shown}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
            />
          )
        ) : (
          <span className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
            <ImagePlus size={26} strokeWidth={1.5} aria-hidden />
            <span className="text-[12.5px] font-medium text-foreground">
              Tap the card to choose an image
            </span>
            <span className="text-[11px]">PNG · JPEG · WebP · up to 2 MB</span>
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/80 py-1.5 text-center text-[11.5px] font-semibold text-cream opacity-0 transition-opacity group-hover:opacity-100">
          {preview
            ? "New image picked — save to upload"
            : shown
              ? "Tap to replace"
              : "Tap to upload"}
        </span>
      </label>
      <input
        id={`${fileField}-file`}
        name={fileField}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label={`${label} — upload file`}
        className="sr-only"
        onChange={onFile}
      />
      <Input
        id={pathField}
        name={pathField}
        defaultValue={current ?? ""}
        placeholder="/prints/… or https://…"
      />
      <p className="text-[11.5px] text-muted-foreground">{hint}</p>
      <FieldError messages={errors} />
    </div>
  );
}

/**
 * Re-apply one control's value from the pre-submit FormData snapshot.
 * File inputs can't be set through `.value` — a DataTransfer re-attaches the
 * actual File object, which is what keeps an image upload alive across a
 * failed save (React resets the form after every action).
 */
function restoreField(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  snapshot: FormData,
) {
  const name = element.name;
  if (!name) return;
  if (element instanceof HTMLInputElement) {
    if (element.type === "file") {
      const file = snapshot.get(name);
      if (file instanceof File && file.size > 0) {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        element.files = transfer.files;
      }
      return;
    }
    if (element.type === "checkbox" || element.type === "radio") {
      // FormData only carries the checked boxes; anything absent was off.
      element.checked = snapshot.getAll(name).includes(element.value);
      return;
    }
  }
  const [value] = snapshot.getAll(name);
  if (typeof value === "string") element.value = value;
}

export function ProductForm({
  mode,
  action,
  collections,
  initial,
}: {
  mode: "create" | "edit";
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  collections: Array<{ id: string; title: string }>;
  initial?: ProductFormInitial;
}) {
  const [state, formAction] = useActionState(action, {});
  const [slugValue, setSlugValue] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));

  const [printType, setPrintType] = useState(
    initial?.printType ?? PATTERN_TYPES[0],
  );
  const [printA, setPrintA] = useState(initial?.printA ?? PALETTE_NAMES[0]);
  const [printB, setPrintB] = useState(initial?.printB ?? PALETTE_NAMES[1]);
  const [badge, setBadge] = useState(initial?.badge ?? "");

  // Structured colour rows (name + swatch hex + which product image it shows).
  // Prefill one blank row on create so the first colour can be typed straight
  // away; the list serialises to a hidden `colorways` JSON input on submit.
  const [colorwayRows, setColorwayRows] = useState<ColorwayRow[]>(() =>
    initial && initial.colorways.length > 0
      ? initial.colorways.map((c) => ({ name: c.name, hex: c.hex, image: c.image }))
      : [{ name: "", hex: "#16233c", image: "a" }],
  );
  const updateColorway = (index: number, patch: Partial<ColorwayRow>) =>
    setColorwayRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  const knownSizes = initial
    ? initial.sizes.filter((s) =>
        (SIZE_TOKENS as readonly string[]).includes(s),
      )
    : [];
  const customSizes = initial
    ? initial.sizes
        .filter((s) => !(SIZE_TOKENS as readonly string[]).includes(s))
        .join(", ")
    : "";

  // Sizes + stock are controlled: the stock grid below follows the selection,
  // and both survive React's post-action form reset on a failed save.
  const [sizeOn, setSizeOn] = useState<Set<string>>(() => new Set(knownSizes));
  const [customText, setCustomText] = useState(customSizes);
  const [stock, setStock] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(initial?.stock ?? {}).map(([size, qty]) => [
        size,
        String(qty),
      ]),
    ),
  );

  const customList = customText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const selectedSizes = [
    ...new Set([...SIZE_TOKENS.filter((size) => sizeOn.has(size)), ...customList]),
  ];

  const toggleSize = (size: string, on: boolean) =>
    setSizeOn((prev) => {
      const next = new Set(prev);
      if (on) next.add(size);
      else next.delete(size);
      return next;
    });

  const setStockEntry = (size: string, qty: string) =>
    setStock((prev) => ({ ...prev, [size]: qty }));

  const money = (pence: number | null | undefined): string =>
    pence === null || pence === undefined ? "" : (pence / 100).toFixed(2);

  const formRef = useRef<HTMLFormElement>(null);
  const snapshotRef = useRef<FormData | null>(null);

  // React resets the form whenever an action settles — including FAILED
  // saves — which would wipe every typed field and silently drop the file
  // chosen in an image slot (the "my image won't save" trap: preview still
  // shows the file, but the input is empty). Snapshot on submit, then restore
  // after a failure so the admin never loses edits or the selected image.
  useEffect(() => {
    const form = formRef.current;
    const snapshot = snapshotRef.current;
    if (!form || !snapshot) return;
    const failed =
      Boolean(state.error) ||
      Object.keys(state.fieldErrors ?? {}).length > 0;
    if (!failed) return;
    for (const element of Array.from(form.elements)) {
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        restoreField(element, snapshot);
      }
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => {
        if (formRef.current) {
          snapshotRef.current = new FormData(formRef.current);
        }
      }}
      className="space-y-6"
    >
      {state.error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13.5px] text-destructive"
        >
          {state.error}
        </div>
      ) : null}

      {/* ---- basics ---- */}
      <section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="text-base font-medium">Product details</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initial?.name ?? ""}
              onChange={(event) => {
                if (!slugTouched) setSlugValue(slugify(event.target.value));
              }}
            />
            <FieldError messages={state.fieldErrors?.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              name="slug"
              required
              value={slugValue}
              placeholder="midnight-stripe-pyjama-set"
              onChange={(event) => {
                setSlugValue(event.target.value);
                setSlugTouched(true);
              }}
            />
            <p className="text-[11.5px] text-muted-foreground">
              /products/{slugValue || "…"}
            </p>
            <FieldError messages={state.fieldErrors?.slug} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              rows={3}
              defaultValue={initial?.description ?? ""}
            />
            <FieldError messages={state.fieldErrors?.description} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="style">Style</Label>
            <Input
              id="style"
              name="style"
              required
              defaultValue={initial?.style ?? ""}
              placeholder="Relaxed fit"
            />
            <FieldError messages={state.fieldErrors?.style} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fabric">Fabric</Label>
            <Input
              id="fabric"
              name="fabric"
              required
              defaultValue={initial?.fabric ?? ""}
              placeholder="100% cotton"
            />
            <FieldError messages={state.fieldErrors?.fabric} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="details">Details (one per line)</Label>
            <Textarea
              id="details"
              name="details"
              rows={4}
              defaultValue={initial?.details.join("\n") ?? ""}
              placeholder={"Soft-wash cotton\nElastic waist…"}
            />
            <p className="text-[11.5px] text-muted-foreground">
              Shown as the bullet list on the product page.
            </p>
            <FieldError messages={state.fieldErrors?.details} />
          </div>
        </div>
      </section>

      {/* ---- colours ---- */}
      <section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-medium">Colours</h2>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              Each colour becomes a swatch circle on the product page — tapping
              it swaps the main image to the colour&apos;s photo.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setColorwayRows((rows) => [
                ...rows,
                { name: "", hex: "#c9c2b6", image: rows.length % 2 === 0 ? "a" : "b" },
              ])
            }
          >
            Add colour
          </Button>
        </div>
        <input
          type="hidden"
          name="colorways"
          value={JSON.stringify(colorwayRows)}
          readOnly
        />
        <div className="space-y-2">
          {colorwayRows.map((row, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
            >
              <input
                type="color"
                value={row.hex}
                aria-label={`Colour ${i + 1} swatch`}
                onChange={(e) => updateColorway(i, { hex: e.target.value })}
                className="size-10 shrink-0 cursor-pointer rounded-md border border-input bg-white p-1"
              />
              <Input
                aria-label={`Colour ${i + 1} name`}
                value={row.name}
                placeholder="Midnight navy multi"
                onChange={(e) => updateColorway(i, { name: e.target.value })}
                className="min-w-40 flex-1"
              />
              <div className="flex overflow-hidden rounded-md border border-input">
                {(["a", "b"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Colour ${i + 1} — use image ${key.toUpperCase()}`}
                    aria-pressed={row.image === key}
                    onClick={() => updateColorway(i, { image: key })}
                    className={cn(
                      "px-3 py-2 text-[12.5px] font-medium transition-colors",
                      row.image === key
                        ? "bg-ink text-cream"
                        : "bg-white hover:bg-meta",
                    )}
                  >
                    {key === "a" ? "Image A" : "Image B"}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove colour ${i + 1}`}
                disabled={colorwayRows.length <= 1}
                onClick={() =>
                  setColorwayRows((rows) => rows.filter((_, index) => index !== i))
                }
              >
                <Trash size={15} aria-hidden />
              </Button>
            </div>
          ))}
        </div>
        <FieldError messages={state.fieldErrors?.colorways} />
      </section>

      {/* ---- pricing ---- */}
      <section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="text-base font-medium">Pricing</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (£)</Label>
            <Input
              id="price"
              name="price"
              required
              inputMode="decimal"
              defaultValue={money(initial?.pricePence)}
              placeholder="24.99"
            />
            <FieldError messages={state.fieldErrors?.price} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compareAt">Compare-at (£, optional)</Label>
            <Input
              id="compareAt"
              name="compareAt"
              inputMode="decimal"
              defaultValue={money(initial?.compareAtPence)}
              placeholder="30.00"
            />
            <FieldError messages={state.fieldErrors?.compareAt} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="badge">Badge</Label>
            <Select name="badge" value={badge} onValueChange={setBadge}>
              <SelectTrigger id="badge" className="w-full">
                <SelectValue placeholder="No badge" />
              </SelectTrigger>
              <SelectContent>
                {BADGES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value === "" ? "No badge" : value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state.fieldErrors?.badge} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              className="tabular-nums"
              defaultValue={initial?.sortOrder ?? 0}
            />
            <FieldError messages={state.fieldErrors?.sortOrder} />
          </div>
        </div>
      </section>

      {/* ---- sizes ---- */}
      <section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-base font-medium">Sizes</h2>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Tick every size you sell — stock is set per size below.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {SIZE_TOKENS.map((size) => (
            <label
              key={size}
              htmlFor={`size-${size}`}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-[13.5px] transition-colors hover:bg-meta"
            >
              <Checkbox
                id={`size-${size}`}
                name="sizes"
                value={size}
                checked={sizeOn.has(size)}
                onCheckedChange={(v) => toggleSize(size, v === true)}
              />
              {size}
            </label>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sizesCustom">Other sizes (comma-separated)</Label>
          <Input
            id="sizesCustom"
            name="sizesCustom"
            value={customText}
            onChange={(event) => setCustomText(event.target.value)}
            placeholder="6-7Y, 8-9Y"
          />
          <FieldError messages={state.fieldErrors?.sizes} />
        </div>

        {selectedSizes.length > 0 ? (
          <div className="space-y-2">
            <div>
              <span className="text-[13.5px] font-medium">Stock by size</span>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                Units on hand. Leave a size blank if you don&apos;t count it —
                blank sizes never block checkout. Enter 0 to mark one sold out.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {selectedSizes.map((size) => (
                <div
                  key={size}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
                >
                  <span className="text-[13px] font-semibold text-muted-foreground">
                    {size}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={999999}
                    step={1}
                    aria-label={`${size} stock`}
                    title={`Units of ${size} on hand — blank = not tracked`}
                    value={stock[size] ?? ""}
                    onChange={(event) =>
                      setStockEntry(size, event.target.value)
                    }
                    placeholder="—"
                    className="w-full min-w-0 bg-transparent text-right text-[13.5px] tabular-nums outline-none placeholder:text-muted-foreground/60"
                  />
                </div>
              ))}
            </div>
            <FieldError messages={state.fieldErrors?.stock} />
          </div>
        ) : null}

        {/* Serialises only ticked sizes with a non-blank quantity — the
            server treats absent sizes as untracked. */}
        <input
          type="hidden"
          name="stock"
          value={JSON.stringify(
            Object.fromEntries(
              Object.entries(stock)
                .filter(
                  ([size, qty]) =>
                    qty.trim() !== "" && selectedSizes.includes(size),
                )
                .map(([size, qty]) => [size, qty.trim()]),
            ),
          )}
          readOnly
        />
      </section>

      {/* ---- print ---- */}
      <section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="text-base font-medium">Print artwork</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="printType">Pattern</Label>
            <Select
              name="printType"
              value={printType}
              onValueChange={setPrintType}
            >
              <SelectTrigger id="printType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PATTERN_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state.fieldErrors?.printType} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="printA">Colorway A (main image)</Label>
            <Select name="printA" value={printA} onValueChange={setPrintA}>
              <SelectTrigger id="printA" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PALETTE_NAMES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state.fieldErrors?.printA} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="printB">Colorway B (hover image)</Label>
            <Select name="printB" value={printB} onValueChange={setPrintB}>
              <SelectTrigger id="printB" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PALETTE_NAMES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state.fieldErrors?.printB} />
          </div>
        </div>
      </section>

      {/* ---- media ---- */}
      <section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="text-base font-medium">Images</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ImageSlot
            label="Image A (main)"
            hint="PNG, JPEG or WebP up to 2 MB. Leave the path empty to remove."
            fileField="imageA"
            pathField="imageAPath"
            current={initial?.imageA ?? null}
            errors={state.fieldErrors?.imageA}
          />
          <ImageSlot
            label="Image B (hover)"
            hint="Defaults to image A when empty."
            fileField="imageB"
            pathField="imageBPath"
            current={initial?.imageB ?? null}
            errors={state.fieldErrors?.imageB}
          />
        </div>
      </section>

      {/* ---- classification ---- */}
      <section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="text-base font-medium">Collections &amp; meta</h2>
        <div className="space-y-1.5">
          <span className="text-[13.5px] font-medium">Collections</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <label
                key={collection.id}
                htmlFor={`collection-${collection.id}`}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-[13.5px] transition-colors hover:bg-meta"
              >
                <Checkbox
                  id={`collection-${collection.id}`}
                  name="collectionIds"
                  value={collection.id}
                  defaultChecked={initial?.collectionIds.includes(
                    collection.id,
                  )}
                />
                {collection.title}
              </label>
            ))}
          </div>
          <FieldError messages={state.fieldErrors?.collectionIds} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label
            htmlFor="featured"
            className="flex cursor-pointer items-center gap-2 self-end rounded-md border border-border px-3 py-2.5 text-[13.5px] transition-colors hover:bg-meta"
          >
            <Checkbox
              id="featured"
              name="featured"
              defaultChecked={initial?.featured ?? false}
            />
            Featured on the homepage
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="rating">Rating (0–5)</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              className="tabular-nums"
              defaultValue={initial?.rating ?? 0}
            />
            <FieldError messages={state.fieldErrors?.rating} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reviews">Review count</Label>
            <Input
              id="reviews"
              name="reviews"
              type="number"
              min="0"
              className="tabular-nums"
              defaultValue={initial?.reviews ?? 0}
            />
            <FieldError messages={state.fieldErrors?.reviews} />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          label={mode === "create" ? "Create product" : "Save changes"}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
