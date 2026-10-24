import Dexie, { type Table } from "dexie";
export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  quantity: number;
  cost: number;
  price: number;
  threshold: number;
  notes: string;
  archived: boolean;
  createdAt: string;
}
export interface Category {
  id: string;
  name: string;
}
export interface Movement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  delta: number;
  before: number;
  after: number;
  reason: string;
  date: string;
  type: "initial" | "in" | "out" | "correction";
}
export interface Setting {
  key: string;
  value: string;
}
class InventoryDB extends Dexie {
  products!: Table<Product, string>;
  categories!: Table<Category, string>;
  movements!: Table<Movement, string>;
  settings!: Table<Setting, string>;
  constructor() {
    super("stockroom-v1");
    this.version(1).stores({
      products: "id,&sku,categoryId",
      categories: "id,&name",
      movements: "id,productId,date",
      settings: "key",
    });
  }
}
export const db = new InventoryDB();
export const id = () => crypto.randomUUID();
const whole = (n: number) => Number.isSafeInteger(n) && n >= 0;
export function validateProduct(p: Product) {
  if (!p.name.trim() || !p.sku.trim())
    throw Error("Name and SKU are required.");
  if (!whole(p.quantity) || !whole(p.threshold))
    throw Error("Stock and threshold must be nonnegative whole numbers.");
  if (
    !Number.isFinite(p.cost) ||
    !Number.isFinite(p.price) ||
    p.cost < 0 ||
    p.price < 0
  )
    throw Error("Prices must be nonnegative numbers.");
}
export async function saveProduct(p: Product, existing?: string) {
  validateProduct(p);
  p = { ...p, name: p.name.trim(), sku: p.sku.trim().toUpperCase() };
  await db.transaction(
    "rw",
    db.products,
    db.movements,
    db.categories,
    async () => {
      if (p.categoryId && !(await db.categories.get(p.categoryId)))
        throw Error("Choose an existing category.");
      const duplicate = await db.products.where("sku").equals(p.sku).first();
      if (duplicate && duplicate.id !== existing)
        throw Error("That SKU already exists, including archived products.");
      if (existing) {
        const old = await db.products.get(existing);
        if (!old) throw Error("Product no longer exists.");
        await db.products.put({ ...p, quantity: old.quantity });
      } else {
        await db.products.add(p);
        await db.movements.add({
          id: id(),
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          delta: p.quantity,
          before: 0,
          after: p.quantity,
          reason: "Initial stock",
          date: new Date().toISOString(),
          type: "initial",
        });
      }
    },
  );
}
export async function adjust(
  productId: string,
  type: "in" | "out" | "correction",
  amount: number,
  reason: string,
) {
  if (!whole(amount) || !reason.trim())
    throw Error("Enter a whole-number quantity and a reason.");
  await db.transaction("rw", db.products, db.movements, async () => {
    const p = await db.products.get(productId);
    if (!p || p.archived) throw Error("Product unavailable.");
    const after =
      type === "correction"
        ? amount
        : p.quantity + (type === "in" ? amount : -amount);
    if (!whole(after))
      throw Error(
        "Stock cannot fall below zero or exceed the supported range.",
      );
    if (after === p.quantity) throw Error("The adjustment must change stock.");
    await db.products.update(p.id, { quantity: after });
    await db.movements.add({
      id: id(),
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      delta: after - p.quantity,
      before: p.quantity,
      after,
      reason: reason.trim(),
      date: new Date().toISOString(),
      type,
    });
  });
}
export async function removeProduct(p: Product) {
  await db.transaction("rw", db.products, db.movements, async () => {
    if (await db.movements.where("productId").equals(p.id).count())
      await db.products.update(p.id, { archived: true });
    else await db.products.delete(p.id);
  });
}
export async function removeCategory(c: Category) {
  await db.transaction("rw", db.products, db.categories, async () => {
    if (await db.products.where("categoryId").equals(c.id).count())
      throw Error(
        "This category contains products (including archived products). Move them first.",
      );
    await db.categories.delete(c.id);
  });
}
export async function backup() {
  return db.transaction("r", db.tables, async () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    products: await db.products.toArray(),
    categories: await db.categories.toArray(),
    movements: await db.movements.toArray(),
    settings: await db.settings.toArray(),
  }));
}
export type Backup = Awaited<ReturnType<typeof backup>>;
export function validateBackup(raw: unknown): Backup {
  const b = raw as Backup;
  if (
    !b ||
    b.version !== 1 ||
    !["products", "categories", "movements", "settings"].every((k) =>
      Array.isArray((b as any)[k]),
    )
  )
    throw Error("Invalid Stock On You v1 backup.");
  const unique = (a: string[]) =>
    a.every((x) => typeof x === "string" && x.length > 0) &&
    new Set(a).size === a.length;
  if (
    !unique(b.products.map((p) => p.id)) ||
    !unique(b.products.map((p) => p.sku.trim().toUpperCase())) ||
    !unique(b.categories.map((c) => c.id)) ||
    !unique(b.categories.map((c) => c.name.trim().toLowerCase())) ||
    !unique(b.movements.map((m) => m.id)) ||
    !unique(b.settings.map((s) => s.key))
  )
    throw Error("Backup contains duplicate or invalid records.");
  for (const c of b.categories)
    if (typeof c.name !== "string" || !c.name.trim())
      throw Error("Invalid category.");
  for (const p of b.products) {
    if (
      typeof p.name !== "string" ||
      typeof p.sku !== "string" ||
      typeof p.notes !== "string" ||
      typeof p.archived !== "boolean" ||
      !Number.isFinite(Date.parse(p.createdAt)) ||
      (!b.categories.some((c) => c.id === p.categoryId) && p.categoryId !== "")
    )
      throw Error("Invalid product record.");
    validateProduct(p);
  }
  for (const m of b.movements) {
    if (
      !b.products.some((p) => p.id === m.productId) ||
      !whole(m.before) ||
      !whole(m.after) ||
      !Number.isSafeInteger(m.delta) ||
      m.after - m.before !== m.delta ||
      typeof m.reason !== "string" ||
      !m.reason.trim() ||
      typeof m.productName !== "string" ||
      typeof m.sku !== "string" ||
      !["initial", "in", "out", "correction"].includes(m.type) ||
      !Number.isFinite(Date.parse(m.date))
    )
      throw Error("Invalid movement record.");
  }
  for (const s of b.settings)
    if (
      s.key !== "currency" ||
      !["USD", "PHP", "EUR", "GBP", "JPY", "CAD", "AUD"].includes(s.value)
    )
      throw Error("Invalid settings.");
  return b;
}
export async function restore(b: Backup) {
  validateBackup(b);
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
    await db.categories.bulkAdd(b.categories);
    await db.products.bulkAdd(
      b.products.map((p) => ({ ...p, sku: p.sku.trim().toUpperCase() })),
    );
    await db.movements.bulkAdd(b.movements);
    await db.settings.bulkAdd(b.settings);
  });
}
export async function sample() {
  await db.transaction("rw", db.tables, async () => {
    if (await db.products.count())
      throw Error("Sample data can only be loaded into an empty inventory.");
    const categories = [
      "Workspace",
      "Electronics",
      "Everyday carry",
      "Paper goods",
    ].map((name) => ({ id: id(), name }));
    await db.categories.bulkAdd(categories);
    const rows: [string, string, number, number, number, number, number][] = [
      ["Studio desk lamp", "WS-001", 0, 24, 32, 58, 8],
      ["Wireless keyboard", "EL-001", 1, 18, 45, 89, 5],
      ["Canvas tote bag", "EC-001", 2, 42, 8, 24, 10],
      ["Dotted notebook", "PG-001", 3, 6, 5, 16, 10],
      ["Ceramic pen holder", "WS-002", 0, 15, 9, 22, 5],
      ["USB-C hub", "EL-002", 1, 0, 24, 49, 5],
      ["Everyday water bottle", "EC-002", 2, 32, 12, 32, 8],
      ["Weekly planner", "PG-002", 3, 4, 7, 20, 6],
    ];
    for (const [name, sku, c, quantity, cost, price, threshold] of rows)
      await saveProduct({
        id: id(),
        name,
        sku,
        categoryId: categories[c].id,
        quantity,
        cost,
        price,
        threshold,
        notes: "",
        archived: false,
        createdAt: new Date().toISOString(),
      });
  });
}
