"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
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
import type { ActionState } from "@/lib/admin-auth";
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
  colorways: string[];
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

  return (
    <div className="space-y-1.5">
      <Label htmlFor={pathField}>{label}</Label>
      <div className="flex gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-meta">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img src={preview} alt="" className="size-full object-cover" />
          ) : current ? (
            <Image
              src={current}
              alt=""
              fill
              unoptimized
              sizes="64px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Input
            id={pathField}
            name={pathField}
            defaultValue={current ?? ""}
            placeholder="/prints/… or https://…"
          />
          <Input
            id={`${fileField}-file`}
            name={fileField}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label={`${label} — upload file`}
            className="text-[13px]"
            onChange={onFile}
          />
          <p className="text-[11.5px] text-muted-foreground">{hint}</p>
          <FieldError messages={errors} />
        </div>
      </div>
    </div>
  );
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

  const money = (pence: number | null | undefined): string =>
    pence === null || pence === undefined ? "" : (pence / 100).toFixed(2);

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13.5px] text-destructive"
        >
          {state.error}
        </div>
      ) : null}

      {/* ---- basics ---- */}
      <section className="space-y-4 rounded-lg border border-border bg-background p-5">
        <h2 className="font-heading text-h5">Product details</h2>
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
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="colorways">Colorways (one per line)</Label>
            <Textarea
              id="colorways"
              name="colorways"
              rows={2}
              defaultValue={initial?.colorways.join("\n") ?? ""}
              placeholder={"Midnight navy multi\nBlush multi"}
            />
            <FieldError messages={state.fieldErrors?.colorways} />
          </div>
        </div>
      </section>

      {/* ---- pricing ---- */}
      <section className="space-y-4 rounded-lg border border-border bg-background p-5">
        <h2 className="font-heading text-h5">Pricing</h2>
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
      <section className="space-y-4 rounded-lg border border-border bg-background p-5">
        <h2 className="font-heading text-h5">Sizes</h2>
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
                defaultChecked={knownSizes.includes(size)}
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
            defaultValue={customSizes}
            placeholder="6-7Y, 8-9Y"
          />
          <FieldError messages={state.fieldErrors?.sizes} />
        </div>
      </section>

      {/* ---- print ---- */}
      <section className="space-y-4 rounded-lg border border-border bg-background p-5">
        <h2 className="font-heading text-h5">Print artwork</h2>
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
      <section className="space-y-4 rounded-lg border border-border bg-background p-5">
        <h2 className="font-heading text-h5">Images</h2>
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
      <section className="space-y-4 rounded-lg border border-border bg-background p-5">
        <h2 className="font-heading text-h5">Collections &amp; meta</h2>
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
