"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveFormSettingsAction } from "@/lib/actions/forms";
import type { ActionState } from "@/lib/admin-auth";
import type {
  CheckoutFormCopy,
  ContactFormCopy,
} from "@/lib/form-copy";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p role="alert" className="mt-1 text-[11.5px] text-destructive">
      {messages[0]}
    </p>
  );
}

type Field =
  | {
      kind: "input";
      name: string;
      label: string;
      value: string;
      maxLength: number;
      hint?: string;
    }
  | {
      kind: "textarea";
      name: string;
      label: string;
      value: string;
      maxLength: number;
      rows: number;
      hint?: string;
    }
  | {
      kind: "lines";
      name: string;
      label: string;
      value: string[];
      hint?: string;
    };

/**
 * One editable form: every field of its settings doc, validated server-side
 * by saveFormSettingsAction (bound to the form's key). `lines` fields edit
 * string arrays one-per-line.
 */
function SettingsCard({
  title,
  description,
  fields,
  action,
  idPrefix,
}: {
  title: string;
  description: string;
  fields: Field[];
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  /** Unique per card — both cards share field names like "heading". */
  idPrefix: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>

      <form action={formAction} className="mt-5 space-y-4">
        {state.ok ? (
          <p
            role="status"
            className="rounded-md border border-forest/40 bg-forest/5 px-4 py-2.5 text-[13.5px] text-forest"
          >
            Saved — the storefront now uses this copy.
          </p>
        ) : null}
        {state.error ? (
          <p
            role="alert"
            className="rounded-md border border-sale/40 bg-sale/5 px-4 py-2.5 text-[13.5px] text-sale"
          >
            {state.error}
          </p>
        ) : null}

        {fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-${field.name}`}>{field.label}</Label>
            {field.kind === "input" ? (
              <Input
                id={`${idPrefix}-${field.name}`}
                name={field.name}
                defaultValue={field.value}
                maxLength={field.maxLength}
              />
            ) : null}
            {field.kind === "textarea" ? (
              <Textarea
                id={`${idPrefix}-${field.name}`}
                name={field.name}
                defaultValue={field.value}
                maxLength={field.maxLength}
                rows={field.rows}
                className="resize-y"
              />
            ) : null}
            {field.kind === "lines" ? (
              <Textarea
                id={`${idPrefix}-${field.name}`}
                name={field.name}
                defaultValue={field.value.join("\n")}
                rows={Math.max(3, field.value.length)}
                className="resize-y"
              />
            ) : null}
            {field.hint ? (
              <p className="text-[11.5px] text-muted-foreground">
                {field.hint}
              </p>
            ) : null}
            <FieldError messages={state.fieldErrors?.[field.name]} />
          </div>
        ))}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </section>
  );
}

export function FormsManager({
  contact,
  checkout,
}: {
  contact: ContactFormCopy;
  checkout: CheckoutFormCopy;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SettingsCard
        title="Contact form"
        description="The heading, intro, subject options and success message shown on /contact."
        action={saveFormSettingsAction.bind(null, "contact")}
        idPrefix="fc"
        fields={[
          {
            kind: "input",
            name: "heading",
            label: "Page heading",
            value: contact.heading,
            maxLength: 120,
          },
          {
            kind: "textarea",
            name: "intro",
            label: "Introduction",
            value: contact.intro,
            maxLength: 400,
            rows: 2,
          },
          {
            kind: "lines",
            name: "subjects",
            label: "Subject options",
            value: contact.subjects,
            hint: "One per line — these fill the dropdown in the form.",
          },
          {
            kind: "input",
            name: "submitLabel",
            label: "Submit button",
            value: contact.submitLabel,
            maxLength: 40,
          },
          {
            kind: "textarea",
            name: "note",
            label: "Form note",
            value: contact.note,
            maxLength: 240,
            rows: 2,
            hint: "The small print printed under the button.",
          },
          {
            kind: "input",
            name: "successTitle",
            label: "Success heading",
            value: contact.successTitle,
            maxLength: 80,
            hint: "Use {name} where the sender's first name should appear.",
          },
          {
            kind: "textarea",
            name: "successBody",
            label: "Success message",
            value: contact.successBody,
            maxLength: 400,
            rows: 3,
          },
        ]}
      />

      <SettingsCard
        title="Checkout form"
        description="Section headings and the cash-on-delivery wording shown on /checkout."
        action={saveFormSettingsAction.bind(null, "checkout")}
        idPrefix="ck"
        fields={[
          {
            kind: "input",
            name: "eyebrow",
            label: "Eyebrow",
            value: checkout.eyebrow,
            maxLength: 40,
          },
          {
            kind: "input",
            name: "heading",
            label: "Page heading",
            value: checkout.heading,
            maxLength: 60,
          },
          {
            kind: "textarea",
            name: "intro",
            label: "Introduction",
            value: checkout.intro,
            maxLength: 400,
            rows: 2,
          },
          {
            kind: "input",
            name: "detailsHeading",
            label: "Delivery details heading",
            value: checkout.detailsHeading,
            maxLength: 60,
          },
          {
            kind: "textarea",
            name: "detailsNote",
            label: "Delivery note",
            value: checkout.detailsNote,
            maxLength: 300,
            rows: 2,
          },
          {
            kind: "input",
            name: "basketHeading",
            label: "Basket heading",
            value: checkout.basketHeading,
            maxLength: 60,
          },
          {
            kind: "input",
            name: "payNoteHeading",
            label: "Payment callout heading",
            value: checkout.payNoteHeading,
            maxLength: 60,
          },
          {
            kind: "textarea",
            name: "payNoteBody",
            label: "Payment callout text",
            value: checkout.payNoteBody,
            maxLength: 400,
            rows: 3,
            hint: "Use {total} where the order total should appear.",
          },
          {
            kind: "input",
            name: "submitLabel",
            label: "Submit button",
            value: checkout.submitLabel,
            maxLength: 40,
            hint: "The order total is appended after the label automatically.",
          },
          {
            kind: "textarea",
            name: "footnote",
            label: "Fine print",
            value: checkout.footnote,
            maxLength: 240,
            rows: 2,
          },
        ]}
      />
    </div>
  );
}
