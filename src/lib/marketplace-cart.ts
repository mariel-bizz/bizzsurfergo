import { useEffect, useState } from "react";
import { getListing, parseListingPrice, type Listing } from "./marketplace-data";

const STORAGE_KEY = "bizzsurfer.marketplace.cart.v1";
const EVENT_NAME = "bizzsurfer:cart-changed";

export type CartItem = {
  listingId: string;
  addedAt: number;
};

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => x && typeof x.listingId === "string") : [];
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getCart(): CartItem[] {
  return readStorage();
}

export function addToCart(listingId: string): boolean {
  const items = readStorage();
  if (items.some((i) => i.listingId === listingId)) return false;
  items.push({ listingId, addedAt: Date.now() });
  writeStorage(items);
  return true;
}

export function removeFromCart(listingId: string) {
  writeStorage(readStorage().filter((i) => i.listingId !== listingId));
}

export function clearCart() {
  writeStorage([]);
}

/** React hook subscribing to cart updates across components and tabs. */
export function useCart(): { items: CartItem[]; listings: Listing[] } {
  const [items, setItems] = useState<CartItem[]>(() => readStorage());

  useEffect(() => {
    const sync = () => setItems(readStorage());
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const listings = items
    .map((i) => getListing(i.listingId))
    .filter((l): l is Listing => !!l);

  return { items, listings };
}

/** Sum of payable items in cart; returns null if any item is quote-only. */
export function cartTotalDisplay(listings: Listing[]): string {
  const parsed = listings.map((l) => parseListingPrice(l.price));
  if (parsed.some((p) => p === null)) return "Mixed (some quote-only)";
  const cents = parsed.reduce((sum, p) => sum + (p?.amountInCents ?? 0), 0);
  return `€${(cents / 100).toLocaleString("en-IE", { minimumFractionDigits: 0 })}`;
}
