"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { PALETTE_NAMES, PATTERN_TYPES } from "@/lib/admin-form";

export interface CollectionFormInitial {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  image: string | null;
  printType: string;
  printA: string;
  printB: string;
  sortOrder: number;
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

export function CollectionForm({
  mode,
  action,
  initial,
}: {
  mode: "create" | "edit";
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: CollectionFormInitial;
}) {
  const [state, formAction] = useActionState(action, {});
  const [slugValue, setSlugValue] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [printType, setPrintType] = useState(
    initial?.printType ?? PATTERN_TYPES[0],
  );
  const [printA, setPrintA] = useState(initial?.printA ?? PALETTE_NAMES[0]);
  const [printB, setPrintB] = useState(initial?.printB ?? PALETTE_NAMES[1]);

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
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13.5px] text-destructive"
        >
          {state.error}
        </div>
      ) : null}

      <section className="space-y-4 rounded-lg border border-border bg-background p-5">
        <h2 className="font-heading text-h5">Collection details</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              onChange={(event) => {
                if (!slugTouched) {
                  setSlugValue(
                    event.target.value
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, ""),
                  );
                }
              }}
            />
            <FieldError messages={state.fieldErrors?.title} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              name="slug"
              required
              value={slugValue}
              placeholder="womens"
              onChange={(event) => {
                setSlugValue(event.target.value);
                setSlugTouched(true);
              }}
            />
            <p className="text-[11.5px] text-muted-foreground">
              /collections/{slugValue || "…"}
            </p>
            <FieldError messages={state.fieldErrors?.slug} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shortTitle">Short label (nav)</Label>
            <Input
              id="shortTitle"
              name="shortTitle"
              required
              defaultValue={initial?.shortTitle ?? ""}
              placeholder="Womens"
            />
            <FieldError messages={state.fieldErrors?.shortTitle} />
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
          <div className="space-y-1.5 md:col-span-2">
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
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-background p-5">
        <h2 className="font-heading text-h5">Banner artwork</h2>
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="printA">Colorway A</Label>
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="printB">Colorway B</Label>
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
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="imagePath">Banner image</Label>
          <div className="flex gap-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-meta">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                <img src={preview} alt="" className="size-full object-cover" />
              ) : initial?.image ? (
                <Image
                  src={initial.image}
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
                id="imagePath"
                name="imagePath"
                defaultValue={initial?.image ?? ""}
                placeholder="/prints/… or https://…"
              />
              <Input
                id="image-file"
                name="image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="text-[13px]"
                onChange={onFile}
              />
              <p className="text-[11.5px] text-muted-foreground">
                PNG, JPEG or WebP up to 2 MB. Leave the path empty to remove.
              </p>
              <FieldError messages={state.fieldErrors?.image} />
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          label={mode === "create" ? "Create collection" : "Save changes"}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/collections">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
