import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import {
  db,
  id,
  saveProduct,
  adjust,
  backup,
  restore,
  validateBackup,
  removeCategory,
  removeProduct,
  sample,
  type Product,
} from "./db";
await db.delete();
await db.open();
const c = { id: id(), name: "Workspace" };
await db.categories.add(c);
const p: Product = {
  id: id(),
  name: "Notebook",
  sku: "note-001",
  categoryId: c.id,
  quantity: 10,
  cost: 5,
  price: 12,
  threshold: 3,
  notes: "",
  archived: false,
  createdAt: new Date().toISOString(),
};
await saveProduct(p);
assert.equal((await db.products.get(p.id))?.sku, "NOTE-001");
assert.equal(await db.movements.count(), 1);
await saveProduct({ ...p, name: "Edited notebook", quantity: 999 }, p.id);
assert.equal((await db.products.get(p.id))?.quantity, 10);
await assert.rejects(() => saveProduct({ ...p, id: id() }));
await adjust(p.id, "in", 5, "Delivery");
await adjust(p.id, "out", 3, "Sale");
await adjust(p.id, "correction", 7, "Stock count");
assert.equal((await db.products.get(p.id))?.quantity, 7);
assert.equal(await db.movements.count(), 4);
await assert.rejects(() => adjust(p.id, "out", 8, "Oversell"));
assert.equal(await db.movements.count(), 4);
assert.equal((await db.products.get(p.id))?.quantity, 7);
await assert.rejects(() => adjust(p.id, "in", 1.5, "Fraction"));
await assert.rejects(() => removeCategory(c));
const b = validateBackup(JSON.parse(JSON.stringify(await backup())));
await adjust(p.id, "in", 1, "After export");
await restore(b);
assert.equal((await db.products.get(p.id))?.quantity, 7);
assert.equal(await db.movements.count(), 4);
assert.throws(() =>
  validateBackup({ ...b, movements: [{ ...b.movements[0], after: -1 }] }),
);
assert.equal((await db.products.get(p.id))?.quantity, 7);
await removeProduct(p);
assert.equal((await db.products.get(p.id))?.archived, true);
assert.equal(await db.movements.count(), 4);
await db.close();
await db.open();
assert.equal((await db.products.get(p.id))?.name, "Edited notebook");
await db.delete();
await db.open();
await sample();
assert.equal(await db.products.count(), 8);
assert.equal(await db.movements.count(), 8);
await db.delete();
console.log(
  "PASS: create, edit, unique SKU, initial history, in/out/correction, transaction rollback, quantity validation, category protection, backup/restore, malformed backup, archive history, reopen persistence, sample data.",
);
