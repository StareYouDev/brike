"use client";

import { useState } from "react";

const subjects = ["Order question", "Returns & exchanges", "Wholesale", "Press", "Something else"];

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: subjects[0], message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Please tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      next.email = "Please enter a valid email address.";
    if (form.message.trim().length < 10)
      next.message = "Please give us a little more detail (10 characters minimum).";
    setErrors(next);
    if (Object.keys(next).length === 0) setSent(true);
  };

  if (sent) {
    return (
      <div className="border border-forest/40 bg-forest/5 p-8">
        <h2 className="font-heading text-h4">Thanks, {form.name.split(" ")[0]}!</h2>
        <p className="mt-3 text-[15.5px] text-foreground/80">
          Your message is ready to send — this is a demo storefront, so nothing left your
          browser. In the live shop we reply within one working day.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setForm({ name: "", email: "", subject: subjects[0], message: "" });
          }}
          className="mt-5 border-2 border-ink px-6 py-2.5 text-[12.5px] font-semibold tracking-[0.14em] uppercase transition-colors hover:bg-ink hover:text-cream"
        >
          Send another
        </button>
      </div>
    );
  }

  const field =
    "w-full border border-input bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-ink";

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium">
            Name
          </label>
          <input id="name" name="name" autoComplete="name" value={form.name} onChange={set("name")} className={field} aria-invalid={Boolean(errors.name)} />
          {errors.name ? <p role="alert" className="mt-1.5 text-[13px] text-sale">{errors.name}</p> : null}
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} className={field} aria-invalid={Boolean(errors.email)} />
          {errors.email ? <p role="alert" className="mt-1.5 text-[13px] text-sale">{errors.email}</p> : null}
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="mb-1.5 block text-[13px] font-medium">
          What&apos;s it about?
        </label>
        <select id="subject" name="subject" value={form.subject} onChange={set("subject")} className={field}>
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-[13px] font-medium">
          Message
        </label>
        <textarea id="message" name="message" rows={6} value={form.message} onChange={set("message")} className={`${field} resize-y`} aria-invalid={Boolean(errors.message)} />
        {errors.message ? <p role="alert" className="mt-1.5 text-[13px] text-sale">{errors.message}</p> : null}
      </div>
      <button
        type="submit"
        className="w-full bg-ink py-4 text-[13px] font-semibold tracking-[0.16em] text-cream uppercase transition-colors hover:bg-peach-deep hover:text-ink sm:w-auto sm:px-10"
      >
        Send message
      </button>
      <p className="text-[12.5px] text-muted-foreground">
        Demo form — your details stay in your browser and are never transmitted.
      </p>
    </form>
  );
}
