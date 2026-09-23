import { beforeEach, describe, expect, it } from "vitest";
import {
  cartCount,
  cartKey,
  cartSubtotal,
  useCart,
  type CartItem,
} from "../store/cart";

const rose: Omit<CartItem, "qty"> = {
  slug: "vintage-rose-cotton-pyjama-set",
  name: "Vintage Rose Cotton Pyjama Set",
  price: 78,
  size: "M",
  colorway: "Rose blush",
  image: "/prints/vintage-rose-cotton-pyjama-set-a.svg",
};

const scarlet: Omit<CartItem, "qty"> = {
  slug: "scarlet-dots-nightdress",
  name: "Scarlet Dots Nightdress",
  price: 65,
  size: "S",
  colorway: "Scarlet spot",
  image: "/prints/scarlet-dots-nightdress-a.svg",
};

const keyOf = (item: Omit<CartItem, "qty">) => cartKey(item);

beforeEach(() => {
  localStorage.clear();
  useCart.setState({ items: [], isOpen: false });
});

describe("cartKey", () => {
  it("joins slug, size and colorway into a stable key", () => {
    expect(cartKey({ slug: "p", size: "M", colorway: "Navy" })).toBe(
      "p::M::Navy",
    );
  });
});

describe("addItem", () => {
  it("adds a line and opens the drawer", () => {
    useCart.getState().addItem(rose);
    const state = useCart.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].qty).toBe(1);
    expect(state.isOpen).toBe(true);
  });

  it("merges quantities for the same product, size and colour", () => {
    useCart.getState().addItem(rose, 2);
    useCart.getState().addItem(rose, 3);
    const state = useCart.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].qty).toBe(5);
  });

  it("caps merged quantity at 10", () => {
    useCart.getState().addItem(rose, 8);
    useCart.getState().addItem(rose, 5);
    expect(useCart.getState().items[0].qty).toBe(10);
  });

  it("keeps different sizes of the same product as separate lines", () => {
    useCart.getState().addItem(rose);
    useCart.getState().addItem({ ...rose, size: "L" });
    expect(useCart.getState().items).toHaveLength(2);
  });

  it("keeps different products as separate lines", () => {
    useCart.getState().addItem(rose);
    useCart.getState().addItem(scarlet);
    expect(useCart.getState().items).toHaveLength(2);
  });
});

describe("setQty / removeItem / clear", () => {
  it("updates quantity for a key", () => {
    useCart.getState().addItem(rose);
    useCart.getState().setQty(keyOf(rose), 4);
    expect(useCart.getState().items[0].qty).toBe(4);
  });

  it("caps quantity at 10", () => {
    useCart.getState().addItem(rose);
    useCart.getState().setQty(keyOf(rose), 99);
    expect(useCart.getState().items[0].qty).toBe(10);
  });

  it("removes the line when quantity drops to zero", () => {
    useCart.getState().addItem(rose);
    useCart.getState().setQty(keyOf(rose), 0);
    expect(useCart.getState().items).toHaveLength(0);
  });

  it("removeItem deletes only the matching line", () => {
    useCart.getState().addItem(rose);
    useCart.getState().addItem(scarlet);
    useCart.getState().removeItem(keyOf(rose));
    const state = useCart.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].slug).toBe(scarlet.slug);
  });

  it("clear empties the basket", () => {
    useCart.getState().addItem(rose);
    useCart.getState().addItem(scarlet);
    useCart.getState().clear();
    expect(useCart.getState().items).toHaveLength(0);
  });
});

describe("totals", () => {
  it("cartCount sums quantities", () => {
    useCart.getState().addItem(rose, 2);
    useCart.getState().addItem(scarlet, 3);
    expect(cartCount(useCart.getState().items)).toBe(5);
  });

  it("cartSubtotal sums price x quantity", () => {
    useCart.getState().addItem(rose, 2); // 156
    useCart.getState().addItem(scarlet, 1); // 65
    expect(cartSubtotal(useCart.getState().items)).toBe(221);
  });
});

describe("persistence", () => {
  it("persists items but not drawer open state", () => {
    useCart.getState().addItem(rose);
    const raw = localStorage.getItem("brike-cart");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as { state: Record<string, unknown> };
    expect(parsed.state.items).toHaveLength(1);
    expect("isOpen" in parsed.state).toBe(false);
  });
});
