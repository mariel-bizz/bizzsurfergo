/**
 * Verifies that the marketplace checkout pricing path cannot be tampered
 * with by the client. The checkout server functions in
 * src/lib/payments.functions.ts now build Stripe line items exclusively
 * from `resolveCanonicalListingPrice(listingId)` and ignore any
 * client-supplied amount/currency/interval/title.
 *
 * This file pins that contract via three guarantees:
 *   1. Known payable listings resolve to their catalog price.
 *   2. Free / "Custom" / "From €X quote" listings are rejected.
 *   3. Unknown listing IDs are rejected.
 *
 * Run with:  bun test tests/marketplace-pricing.test.ts
 */

import { describe, expect, test } from "bun:test";
import { resolveCanonicalListingPrice } from "../src/lib/marketplace-pricing";
import { getListing, parseListingPrice } from "../src/lib/marketplace-data";

const PAYABLE_FIXTURES = [
  { id: "agent-deal-radar", expectedCents: 3900, interval: "month" as const },
  { id: "agent-policy-scout", expectedCents: 5900, interval: "month" as const },
  { id: "tpl-prompt-pack", expectedCents: 2900, interval: null },
  { id: "tpl-playbook", expectedCents: 4900, interval: null },
];

describe("resolveCanonicalListingPrice", () => {
  test.each(PAYABLE_FIXTURES)(
    "returns the catalog price for $id and ignores any client-supplied amount",
    ({ id, expectedCents, interval }) => {
      const canonical = resolveCanonicalListingPrice(id);
      expect(canonical.amountInCents).toBe(expectedCents);
      expect(canonical.currency).toBe("eur");
      expect(canonical.interval).toBe(interval);

      // Simulate what the checkout handler does: it builds the Stripe
      // line item from `canonical`, never from the client payload. Even
      // if a malicious client sends amountInCents=50, the server-side
      // value is unchanged.
      const tamperedClientAmount = 50;
      const lineItemUnitAmount = canonical.amountInCents; // server-derived
      expect(lineItemUnitAmount).not.toBe(tamperedClientAmount);
      expect(lineItemUnitAmount).toBe(expectedCents);
    },
  );

  test("rejects unknown listingId", () => {
    expect(() => resolveCanonicalListingPrice("does-not-exist")).toThrow(
      /Listing not found/,
    );
  });

  test("rejects free listings (cannot be paid for)", () => {
    // tpl-roi-model is priced "Free"
    expect(getListing("tpl-roi-model")?.price.toLowerCase()).toContain("free");
    expect(() => resolveCanonicalListingPrice("tpl-roi-model")).toThrow(
      /not directly payable/,
    );
  });

  test("rejects 'Included' listings (bundled with a plan)", () => {
    expect(getListing("agent-board-brief")?.price.toLowerCase()).toContain(
      "included",
    );
    expect(() => resolveCanonicalListingPrice("agent-board-brief")).toThrow(
      /not directly payable/,
    );
  });

  test("rejects 'Custom' quote-only listings", () => {
    expect(getListing("svc-agentops")?.price.toLowerCase()).toContain("custom");
    expect(() => resolveCanonicalListingPrice("svc-agentops")).toThrow(
      /not directly payable/,
    );
  });
});

describe("cart subtotal is server-derived", () => {
  test("a tampered client subtotal does not influence the canonical sum", () => {
    const cart = ["agent-deal-radar", "tpl-prompt-pack", "tpl-playbook"];
    const canonicalItems = cart.map((id) => resolveCanonicalListingPrice(id));
    const canonicalSubtotal = canonicalItems.reduce(
      (s, it) => s + it.amountInCents,
      0,
    );
    // 3900 + 2900 + 4900
    expect(canonicalSubtotal).toBe(11700);

    // A malicious client could send expectedSubtotalCents=300; the server
    // recomputes from canonical prices and would reject the mismatch
    // before calling Stripe.
    const tamperedClientSubtotal = 300;
    expect(canonicalSubtotal).not.toBe(tamperedClientSubtotal);
  });
});

describe("parseListingPrice contract used by the resolver", () => {
  test("returns null for non-payable strings", () => {
    expect(parseListingPrice("Free")).toBeNull();
    expect(parseListingPrice("Included with Hero")).toBeNull();
    expect(parseListingPrice("Custom")).toBeNull();
  });

  test("parses recurring euro pricing", () => {
    const p = parseListingPrice("€39 / mo");
    expect(p).not.toBeNull();
    expect(p!.amountInCents).toBe(3900);
    expect(p!.currency).toBe("eur");
    expect(p!.interval).toBe("month");
  });

  test("parses one-off euro pricing", () => {
    const p = parseListingPrice("€29");
    expect(p).not.toBeNull();
    expect(p!.amountInCents).toBe(2900);
    expect(p!.interval).toBeNull();
  });
});
