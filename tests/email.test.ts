import { afterEach, describe, expect, it, vi } from "vitest";
import {
  newOrderAlertEmail,
  orderConfirmationEmail,
  orderShippedEmail,
  sendEmail,
} from "../lib/email";

const order = {
  code: "BRK-ABC123",
  name: "Jo <b>Bloggs</b>",
  email: "jo@example.test",
  phone: "07700 900123",
  address1: "1 Test Street",
  address2: null,
  city: "London",
  postcode: "SW1A 1AA",
  subtotalPence: 1700,
  deliveryPence: 0,
  totalPence: 1700,
};

const items = [
  {
    name: "Celestial harlequin set",
    size: "M",
    colorway: "Navy multi",
    qty: 2,
    unitPricePence: 850,
  },
];

describe("transactional email", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
  });

  it("sendEmail no-ops (false) without RESEND_API_KEY and never fetches", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const sent = await sendEmail({
      to: "jo@example.test",
      subject: "Hello",
      html: "<p>Hi</p>",
      text: "Hi",
    });
    expect(sent).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sendEmail posts to Resend with the bearer key and resolves true", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    const fetchSpy = vi.fn(async () => ({ ok: true, text: async () => "" }));
    vi.stubGlobal("fetch", fetchSpy);

    const sent = await sendEmail({
      to: "jo@example.test",
      subject: "Hello",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    expect(sent).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer re_test_key",
    );
    const body = JSON.parse(String(init.body));
    expect(body.to).toEqual(["jo@example.test"]);
    expect(body.from).toContain("brike.co.uk");
  });

  it("sendEmail resolves false (never throws) on an API error", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 422,
        text: async () => "domain not verified",
      })),
    );
    await expect(
      sendEmail({
        to: "jo@example.test",
        subject: "Hello",
        html: "<p>Hi</p>",
        text: "Hi",
      }),
    ).resolves.toBe(false);
  });

  it("confirmation carries the code, totals and escapes hostile names", () => {
    const mail = orderConfirmationEmail(order, items);
    expect(mail.to).toBe("jo@example.test");
    expect(mail.subject).toContain("BRK-ABC123");
    expect(mail.html).toContain("£17.00");
    expect(mail.html).toContain("Jo &lt;b&gt;Bloggs&lt;/b&gt;");
    expect(mail.html).not.toContain("Jo <b>Bloggs</b>");
    expect(mail.text).toContain("cash on delivery");
    expect(mail.text).toContain("SW1A 1AA");
  });

  it("owner alert goes to the owner with an admin deep link", () => {
    const mail = newOrderAlertEmail(order, items, "36f0-id");
    expect(mail.to).toBe("admin@brike.co.uk");
    expect(mail.subject).toContain("New order BRK-ABC123");
    expect(mail.html).toContain("/admin/orders/36f0-id");
    expect(mail.html).toContain("jo@example.test");
    expect(mail.text).toContain("£17.00");
  });

  it("shipped notice targets the customer and names the code", () => {
    const mail = orderShippedEmail({
      code: "BRK-ABC123",
      name: "Jo Bloggs",
      email: "jo@example.test",
    });
    expect(mail.to).toBe("jo@example.test");
    expect(mail.subject).toBe("Order BRK-ABC123 is on its way");
    expect(mail.text).toContain("cash on delivery");
  });
});
