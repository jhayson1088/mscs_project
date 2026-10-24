import {
  AppTheme,
  ThemeToggle,
  Button,
  Input,
  TextArea,
  Select,
  Field,
  Modal,
  StockBadge,
  Feedback,
} from "./ui";
import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useLiveQuery } from "dexie-react-hooks";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Tags,
  Settings,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Upload,
  Database,
  ShieldCheck,
  Leaf,
  MoreHorizontal,
  Archive,
  Pencil,
  Trash2,
  AlertTriangle,
  Boxes,
  Check,
  LoaderCircle,
} from "lucide-react";
import {
  db,
  id,
  saveProduct,
  adjust,
  removeProduct,
  removeCategory,
  sample,
  backup,
  restore,
  validateBackup,
  type Product,
  type Category,
  type Backup,
} from "./db";
import "./style.css";
const nav = [
  ["Dashboard", LayoutDashboard],
  ["Products", Package],
  ["Movements", ArrowLeftRight],
  ["Categories", Tags],
  ["Settings", Settings],
] as const;
const status = (p: Product) =>
  p.quantity === 0
    ? "Out of stock"
    : p.quantity <= p.threshold
      ? "Low stock"
      : "In stock";
function App() {
  const [page, setPage] = useState("Dashboard"),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [cat, setCat] = useState(""),
    [stock, setStock] = useState(""),
    [sort, setSort] = useState("name"),
    [current, setCurrent] = useState(1),
    [modal, setModal] = useState<"product" | "stock" | "category" | null>(null),
    [selected, setSelected] = useState<Product>(),
    [category, setCategory] = useState<Category>(),
    [busy, setBusy] = useState(false),
    [fatal, setFatal] = useState("");
  const data = useLiveQuery(async () => {
    try {
      return await db.transaction("r", db.tables, async () => ({
        products: await db.products.toArray(),
        categories: await db.categories.toArray(),
        movements: await db.movements.orderBy("date").reverse().toArray(),
        currency: (await db.settings.get("currency"))?.value || "USD",
      }));
    } catch (e) {
      setFatal(String(e));
      throw e;
    }
  }, []);
  useEffect(() => {
    setCurrent(1);
  }, [query, cat, stock, sort]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 4500);
      return () => clearTimeout(t);
    }
  }, [notice]);
  async function run(fn: () => Promise<unknown>, msg: string, close = true) {
    setBusy(true);
    setError("");
    try {
      await fn();
      setNotice(msg);
      if (close) setModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <div className="loading">
        {fatal ? (
          <>
            <AlertTriangle />
            <h2>We couldn’t open your inventory</h2>
            <p>{fatal}</p>
            <Button onClick={() => location.reload()}>Try again</Button>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" />
            <p>Opening your stockroom…</p>
          </>
        )}
      </div>
    );
  const { products, categories, movements, currency } = data,
    active = products.filter((p) => !p.archived),
    low = active.filter((p) => p.quantity <= p.threshold),
    money = (v: number) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(v),
    categoryName = (p: Product) =>
      categories.find((c) => c.id === p.categoryId)?.name || "Uncategorized";
  const filtered = active
    .filter(
      (p) =>
        (p.name + " " + p.sku).toLowerCase().includes(query.toLowerCase()) &&
        (!cat || p.categoryId === cat) &&
        (!stock || status(p) === stock),
    )
    .sort((a, b) =>
      sort === "quantity"
        ? a.quantity - b.quantity
        : sort === "value"
          ? b.quantity * b.cost - a.quantity * a.cost
          : a.name.localeCompare(b.name),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 6)),
    shown = filtered.slice(
      (Math.min(current, pages) - 1) * 6,
      Math.min(current, pages) * 6,
    );
  const openProduct = (p?: Product) => {
    setSelected(p);
    setError("");
    setModal("product");
  };
  const openStock = (p: Product) => {
    setSelected(p);
    setError("");
    setModal("stock");
  };
  const close = () => {
    setModal(null);
    setError("");
  };
  async function exportData() {
    await run(
      async () => {
        const b = await backup(),
          url = URL.createObjectURL(
            new Blob([JSON.stringify(b, null, 2)], {
              type: "application/json",
            }),
          );
        const a = document.createElement("a");
        a.href = url;
        a.download = `stockroom-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      "Backup exported. Keep it somewhere safe.",
      false,
    );
  }
  const productList = (
    <>
      <div className="filters">
        <div className="search">
          <Search size={17} />
          <Input
            aria-label="Search products"
            placeholder="Search by name or SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          aria-label="Filter category"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter stock status"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        >
          <option value="">All stock statuses</option>
          {["In stock", "Low stock", "Out of stock"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select
          aria-label="Sort products"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="name">Name A–Z</option>
          <option value="quantity">Stock: low to high</option>
          <option value="value">Value: high to low</option>
        </Select>
      </div>
      {!shown.length ? (
        <div className="empty">
          <Package size={30} />
          <h3>
            {active.length
              ? "No matching products"
              : "A fresh start for your inventory"}
          </h3>
          <p>
            {active.length
              ? "Try a different search or clear your filters."
              : "Add your first product or explore with sample data."}
          </p>
          <Button
            onClick={() =>
              active.length
                ? (setQuery(""), setCat(""), setStock(""))
                : openProduct()
            }
          >
            {active.length ? "Clear filters" : "Add a product"}
          </Button>
          {!products.length && (
            <Button
              className="secondary"
              disabled={busy}
              onClick={() => run(sample, "Sample inventory is ready.", false)}
            >
              Load sample data
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock level</th>
                  <th>Cost price</th>
                  <th>Inventory value</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="product-name">
                        <span
                          className={"product-icon tone" + (p.name.length % 4)}
                        >
                          <Package size={21} />
                        </span>
                        <div>
                          <strong>{p.name}</strong>
                          <small>{p.sku}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-label">{categoryName(p)}</span>
                    </td>
                    <td>
                      <strong>
                        {p.quantity} <span className="muted normal">units</span>
                      </strong>
                      <br />
                      <StockBadge quantity={p.quantity} threshold={p.threshold} />
                    </td>
                    <td>
                      {money(p.cost)}
                      <small>Sell {money(p.price)}</small>
                    </td>
                    <td>
                      <strong>{money(p.quantity * p.cost)}</strong>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button
                          className="icon"
                          title="Adjust stock"
                          aria-label={`Adjust stock for ${p.name}`}
                          onClick={() => openStock(p)}
                        >
                          <ArrowLeftRight size={17} />
                        </Button>
                        <Button
                          className="icon"
                          title="Edit product"
                          aria-label={`Edit ${p.name}`}
                          onClick={() => openProduct(p)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          className="icon danger"
                          title="Archive product"
                          aria-label={`Archive ${p.name}`}
                          onClick={() => {
                            if (
                              confirm(
                                `Archive ${p.name}? Its movement history will be preserved.`,
                              )
                            )
                              run(
                                () => removeProduct(p),
                                "Product archived.",
                                false,
                              );
                          }}
                        >
                          <Archive size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-products">
            {shown.map((p) => (
              <article key={p.id}>
                <div className="flex">
                  <div>
                    <strong>{p.name}</strong>
                    <small>
                      {p.sku} · {categoryName(p)}
                    </small>
                  </div>
                  <StockBadge quantity={p.quantity} threshold={p.threshold} />
                </div>
                <div className="flex">
                  <p>
                    {p.quantity} units · {money(p.quantity * p.cost)}
                  </p>
                  <div className="row-actions">
                    <Button
                      className="icon"
                      aria-label={`Adjust stock for ${p.name}`}
                      onClick={() => openStock(p)}
                    >
                      <ArrowLeftRight size={17} />
                    </Button>
                    <Button
                      className="icon"
                      aria-label={`Edit ${p.name}`}
                      onClick={() => openProduct(p)}
                    >
                      <Pencil size={17} />
                    </Button>
                    <Button
                      className="icon"
                      aria-label={`Archive ${p.name}`}
                      onClick={() => {
                        if (confirm(`Archive ${p.name}?`))
                          run(
                            () => removeProduct(p),
                            "Product archived.",
                            false,
                          );
                      }}
                    >
                      <Archive size={17} />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <footer className="pagination">
            <span>
              Showing {(Math.min(current, pages) - 1) * 6 + 1}–
              {Math.min(Math.min(current, pages) * 6, filtered.length)} of{" "}
              {filtered.length} products
            </span>
            <div>
              <Button
                className="icon"
                aria-label="Previous page"
                disabled={current <= 1}
                onClick={() => setCurrent(current - 1)}
              >
                <ChevronLeft size={17} />
              </Button>
              <span>
                {Math.min(current, pages)} / {pages}
              </span>
              <Button
                className="icon"
                aria-label="Next page"
                disabled={current >= pages}
                onClick={() => setCurrent(current + 1)}
              >
                <ChevronRight size={17} />
              </Button>
            </div>
          </footer>
        </>
      )}
    </>
  );
  return (
    <div className="app">
      <aside>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Dashboard");
          }}
        >
          <img className="brand-mark" src="/stockroom-mark.svg" alt="" width="40" height="40" />
          stockroom<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">S</span>
          <div>
            <strong>My workspace</strong>
            <small>Personal inventory</small>
          </div>
          <ShieldCheck size={16} />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {nav.map(([name, Icon]) => (
            <Button
              className={page === name ? "nav-button active" : "nav-button"}
              key={name}
              onClick={() => {
                setPage(name);
                setError("");
              }}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === "Products" && <em>{active.length}</em>}
            </Button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <Database size={20} />
            <strong>Yours, and only yours.</strong>
            <p>
              Your inventory stays in this browser, on this device. Export
              backups regularly.
            </p>
            <Button onClick={() => setPage("Settings")}>
              Manage backups <ArrowUpRight size={14} />
            </Button>
          </div>
          <div className="profile">
            <span>MW</span>
            <div>
              <strong>My workspace</strong>
              <small>Local storage enabled</small>
            </div>
            <i />
          </div>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <span>
            Workspace <ChevronRight size={14} /> <strong>{page}</strong>
          </span>
          <div className="topbar-tools"><span className="saved"><i /> Saved on this device</span><ThemeToggle /></div>
        </div>
        <main>
          <div className="page-heading">
            <div>
              {page === "Dashboard" ? (
                <div className="dashboard-identity">
                  <img src="/stockroom-mark.svg" alt="Stockroom custom S monogram with stocked shelves" width="52" height="52" />
                  <div><span className="dashboard-wordmark">stockroom<span>.</span></span><span className="eyebrow">YOUR INVENTORY, IN ORDER</span></div>
                </div>
              ) : <span className="eyebrow">YOUR INVENTORY, IN ORDER</span>}
              <h1>
                {page === "Dashboard"
                  ? "A little clarity. A lot of control."
                  : page}
              </h1>
              <p>
                {page === "Dashboard"
                  ? "Here’s what’s happening in your stockroom."
                  : page === "Products"
                    ? "A home for every product. Keep the details in order."
                    : page === "Movements"
                      ? "Every change, accounted for."
                      : page === "Categories"
                        ? "Give your products a little structure."
                        : "Your workspace, your preferences."}
              </p>
            </div>
            <div className="heading-actions">
              {(page === "Dashboard" || page === "Products") && (
                <>
                  <Button className="secondary" onClick={exportData}>
                    <Download size={16} /> Export backup
                  </Button>
                  <Button onClick={() => openProduct()}>
                    <Plus size={17} /> Add product
                  </Button>
                </>
              )}
              {page === "Categories" && (
                <Button
                  onClick={() => {
                    setCategory(undefined);
                    setModal("category");
                  }}
                >
                  <Plus size={17} /> Add category
                </Button>
              )}
            </div>
          </div>
          {error && !modal && (
            <div role="alert" className="error">
              {error}
              <Button
                className="icon"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={16} />
              </Button>
            </div>
          )}
          {page === "Dashboard" && (
            <>
              <div className="stats">
                {[
                  [
                    Package,
                    "Total products",
                    active.length,
                    "Active in your inventory",
                  ],
                  [
                    Boxes,
                    "Total units",
                    active.reduce((n, p) => n + p.quantity, 0),
                    "Across all products",
                  ],
                  [
                    ArrowUpRight,
                    "Inventory value",
                    money(active.reduce((n, p) => n + p.quantity * p.cost, 0)),
                    "Based on cost price",
                  ],
                  [
                    AlertTriangle,
                    "Low-stock alerts",
                    low.length,
                    "Products needing attention",
                  ],
                ].map(([Icon, label, value, caption]: any, i) => (
                  <div className={"stat stat" + i} key={label}>
                    <div className="flex">
                      <span>{label}</span>
                      <span className="stat-icon"><Icon size={19} /></span>
                    </div>
                    <h2>{value}</h2>
                    <small>{caption}</small>
                  </div>
                ))}
              </div>
              {low.length > 0 && (
                <div className="stock-alert">
                  <span className="alert-icon">
                    <AlertTriangle size={20} />
                  </span>
                  <div>
                    <strong>A few shelves need some love</strong>
                    <p>
                      {low.length} products are running low or out of stock. A
                      quick restock keeps things moving.
                    </p>
                  </div>
                  <Button
                    className="text-button"
                    onClick={() => {
                      setStock("Low stock");
                      setPage("Products");
                    }}
                  >
                    Review stock <ArrowUpRight size={16} />
                  </Button>
                </div>
              )}
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      Inventory overview{" "}
                      <span className="count">{active.length}</span>
                    </h2>
                    <p>The essentials, all in one place.</p>
                  </div>
                  <Button
                    className="text-button"
                    onClick={() => setPage("Products")}
                  >
                    View all products <ArrowUpRight size={16} />
                  </Button>
                </div>
                {productList}
              </section>
              <div className="dashboard-bottom">
                <section className="panel">
                  <div className="panel-heading">
                    <h2>Recent activity</h2>
                    <Button
                      className="text-button"
                      onClick={() => setPage("Movements")}
                    >
                      View history <ArrowUpRight size={16} />
                    </Button>
                  </div>
                  {movements.slice(0, 3).map((m) => (
                    <div className="activity" key={m.id}>
                      <span
                        className={
                          "activity-icon " + (m.delta >= 0 ? "green" : "amber")
                        }
                      >
                        {m.delta >= 0 ? (
                          <ArrowDownLeft size={18} />
                        ) : (
                          <ArrowUpRight size={18} />
                        )}
                      </span>
                      <div>
                        <strong>{m.productName}</strong>
                        <small>
                          {m.reason} · {new Date(m.date).toLocaleDateString()}
                        </small>
                      </div>
                      <b className={m.delta >= 0 ? "positive" : ""}>
                        {m.delta > 0 ? "+" : ""}
                        {m.delta}
                      </b>
                    </div>
                  ))}
                  {!movements.length && (
                    <p className="empty small-empty">
                      Your stock movements will appear here.
                    </p>
                  )}
                </section>
                <section className="tip">
                  <span>
                    <Leaf size={24} />
                  </span>
                  <h2>
                    Small habits.
                    <br />
                    Healthy inventory.
                  </h2>
                  <p>
                    Keep stock up to date as products come and go. Your future
                    self will thank you.
                  </p>
                  <span className="tip-foot">
                    <ShieldCheck size={15} /> Private by design. Simple by
                    choice.
                  </span>
                </section>
              </div>
            </>
          )}
          {page === "Products" && (
            <section className="panel">
              <div className="panel-heading">
                <h2>
                  All products <span className="count">{active.length}</span>
                </h2>
              </div>
              {productList}
            </section>
          )}
          {page === "Movements" && (
            <section className="panel">
              <div className="panel-heading">
                <h2>
                  Stock movement history{" "}
                  <span className="count">{movements.length}</span>
                </h2>
              </div>
              <div className="filters">
                <div className="search">
                  <Search size={17} />
                  <Input
                    aria-label="Search movements"
                    placeholder="Search product, SKU or reason…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="history-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Change</th>
                      <th>Before → After</th>
                      <th>Reason</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements
                      .filter((m) =>
                        (m.productName + " " + m.sku + " " + m.reason)
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((m) => (
                        <tr key={m.id}>
                          <td>
                            <strong>{m.productName}</strong>
                            <small>
                              {m.sku}
                              {products.find((p) => p.id === m.productId)
                                ?.archived
                                ? " · Archived"
                                : ""}
                            </small>
                          </td>
                          <td>
                            <span
                              className={
                                "badge " + (m.delta >= 0 ? "green" : "amber")
                              }
                            >
                              {m.delta > 0 ? "+" : ""}
                              {m.delta}
                            </span>
                            <small>{m.type}</small>
                          </td>
                          <td>
                            {m.before} → {m.after}
                          </td>
                          <td>{m.reason}</td>
                          <td>{new Date(m.date).toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!movements.length && (
                <div className="empty">
                  <ArrowLeftRight />
                  <h3>No movements yet</h3>
                  <p>Add a product to start your history.</p>
                </div>
              )}
            </section>
          )}
          {page === "Categories" && (
            <div className="category-grid">
              {categories.map((c) => (
                <section className="panel category-card" key={c.id}>
                  <span className="product-icon">
                    <Tags size={23} />
                  </span>
                  <h2>{c.name}</h2>
                  <p>
                    {active.filter((p) => p.categoryId === c.id).length} active
                    products
                  </p>
                  <div className="flex">
                    <Button
                      className="secondary"
                      onClick={() => {
                        setCategory(c);
                        setModal("category");
                      }}
                    >
                      <Pencil size={15} /> Rename
                    </Button>
                    <Button
                      className="icon danger"
                      aria-label={`Delete ${c.name}`}
                      onClick={() => {
                        if (confirm(`Delete category ${c.name}?`))
                          run(
                            () => removeCategory(c),
                            "Category deleted.",
                            false,
                          );
                      }}
                    >
                      <Trash2 size={17} />
                    </Button>
                  </div>
                </section>
              ))}
              {!categories.length && (
                <div className="empty">
                  <Tags />
                  <h3>Everything in its place</h3>
                  <p>Add a category to organize your inventory.</p>
                </div>
              )}
            </div>
          )}
          {page === "Settings" && (
            <div className="settings-grid">
              <section className="panel settings-card">
                <span className="product-icon">
                  <Settings />
                </span>
                <h2>Workspace preferences</h2>
                <p>Choose how prices and values appear.</p>
                <Field label="Currency">
                  <Select
                    value={currency}
                    onChange={(e) =>
                      run(
                        () =>
                          db.settings.put({
                            key: "currency",
                            value: e.target.value,
                          }),
                        "Currency updated.",
                        false,
                      )
                    }
                  >
                    {["USD", "PHP", "EUR", "GBP", "JPY", "CAD", "AUD"].map(
                      (c) => (
                        <option key={c}>{c}</option>
                      ),
                    )}
                  </Select>
                </Field>
              </section>
              <section className="panel settings-card">
                <span className="product-icon">
                  <Database />
                </span>
                <h2>Your data, in your hands</h2>
                <p>
                  Data is stored in this browser on this device. Clearing
                  browser data removes your inventory. Export JSON backups
                  regularly and before switching browsers or devices.
                </p>
                <div className="settings-actions">
                  <Button onClick={exportData}>
                    <Download size={16} /> Export JSON backup
                  </Button>
                  <label className="button secondary">
                    <Upload size={16} /> Restore JSON backup
                    <input
                      className="file-input"
                      type="file"
                      accept=".json,application/json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        await run(
                          async () => {
                            if (file.size > 20 * 1024 * 1024)
                              throw Error(
                                "Backup is too large (maximum 20 MB).",
                              );
                            let b: Backup;
                            try {
                              b = validateBackup(JSON.parse(await file.text()));
                            } catch (err) {
                              throw Error(
                                "Cannot restore: " +
                                  (err instanceof Error
                                    ? err.message
                                    : String(err)),
                              );
                            }
                            if (
                              confirm(
                                `Replace ALL existing data with ${b.products.length} products, ${b.categories.length} categories and ${b.movements.length} movements? Export a backup first if needed.`,
                              )
                            )
                              await restore(b);
                            else
                              throw Error(
                                "Restore cancelled. Existing data was kept.",
                              );
                          },
                          "Backup restored successfully.",
                          false,
                        );
                      }}
                    />
                  </label>
                </div>
              </section>
              <section className="panel settings-card">
                <h2>Take a look around</h2>
                <p>
                  Start with a small sample inventory to explore the app.
                  Available when there are no product records.
                </p>
                <Button
                  className="secondary"
                  disabled={busy || products.length > 0}
                  onClick={() => run(sample, "Sample data loaded.", false)}
                >
                  <Plus size={16} /> Load sample data
                </Button>
              </section>
              <section className="panel settings-card">
                <h2>Archived products</h2>
                <p>
                  History stays intact when products leave your active
                  inventory. Archived SKUs remain reserved.
                </p>
                {products
                  .filter((p) => p.archived)
                  .map((p) => (
                    <div className="archived-row" key={p.id}>
                      <span>
                        {p.name}
                        <small>
                          {p.sku} · {p.quantity} units
                        </small>
                      </span>
                      <Button
                        className="secondary"
                        onClick={() =>
                          run(
                            () => db.products.update(p.id, { archived: false }),
                            "Product restored.",
                            false,
                          )
                        }
                      >
                        Unarchive
                      </Button>
                    </div>
                  ))}
                {!products.some((p) => p.archived) && (
                  <small>No archived products.</small>
                )}
              </section>
            </div>
          )}
          <footer className="main-footer">
            <span>
              <ShieldCheck size={14} /> Stored locally. Backed by you.
            </span>
            <span>Stockroom · A place for everything.</span>
          </footer>
        </main>
      </div>
      {notice && <Feedback message={notice} clear={() => setNotice("")} />}
      {modal === "product" && (
        <Modal
          title={selected ? "Edit product" : "Add a product"}
          close={close}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const p: Product = {
                id: selected?.id || id(),
                name: String(f.get("name")),
                sku: String(f.get("sku")),
                categoryId: String(f.get("categoryId")),
                quantity: selected?.quantity ?? Number(f.get("quantity")),
                cost: Number(f.get("cost")),
                price: Number(f.get("price")),
                threshold: Number(f.get("threshold")),
                notes: String(f.get("notes")),
                archived: false,
                createdAt: selected?.createdAt || new Date().toISOString(),
              };
              run(() => saveProduct(p, selected?.id), "Product saved.");
            }}
          >
            <Field label="Product name *">
              <Input
                name="name"
                required
                autoFocus
                defaultValue={selected?.name}
                placeholder="e.g. Studio desk lamp"
              />
            </Field>
            <div className="form-grid">
              <Field label="Unique SKU *">
                <Input
                  name="sku"
                  required
                  defaultValue={selected?.sku}
                  placeholder="WS-001"
                />
              </Field>
              <Field label="Category">
                <Select
                  name="categoryId"
                  defaultValue={selected?.categoryId || ""}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={`Cost price (${currency}) *`}>
                <Input
                  name="cost"
                  type="number"
                  min="0"
                  step="any"
                  required
                  defaultValue={selected?.cost ?? 0}
                />
              </Field>
              <Field label={`Selling price (${currency}) *`}>
                <Input
                  name="price"
                  type="number"
                  min="0"
                  step="any"
                  required
                  defaultValue={selected?.price ?? 0}
                />
              </Field>
              {!selected && (
                <Field label="Initial quantity *">
                  <Input
                    name="quantity"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={0}
                  />
                </Field>
              )}
              <Field label="Low-stock threshold *">
                <Input
                  name="threshold"
                  type="number"
                  min="0"
                  step="1"
                  required
                  defaultValue={selected?.threshold ?? 5}
                />
              </Field>
            </div>
            {selected && (
              <p className="hint">
                Current stock: {selected.quantity} units. Use a stock adjustment
                to change quantity and keep a complete history.
              </p>
            )}
            <Field label="Notes (optional)">
              <TextArea
                name="notes"
                rows={3}
                defaultValue={selected?.notes}
                placeholder="Anything useful to remember…"
              />
            </Field>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-footer">
              <Button type="button" className="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy
                  ? "Saving…"
                  : selected
                    ? "Save changes"
                    : "Create product"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "stock" && selected && (
        <Modal title="Adjust stock" close={close}>
          <p className="modal-desc">
            <strong>{selected.name}</strong>
            <small>
              {selected.sku} · Currently {selected.quantity} units
            </small>
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(
                () =>
                  adjust(
                    selected.id,
                    String(f.get("type")) as "in" | "out" | "correction",
                    Number(f.get("amount")),
                    String(f.get("reason")),
                  ),
                "Stock adjustment recorded.",
              );
            }}
          >
            <Field label="Adjustment type">
              <Select name="type">
                <option value="in">Stock in — add units</option>
                <option value="out">Stock out — remove units</option>
                <option value="correction">
                  Correction — set actual quantity
                </option>
              </Select>
            </Field>
            <Field label="Quantity (actual stock for corrections) *">
              <Input
                autoFocus
                name="amount"
                type="number"
                required
                min="0"
                step="1"
                defaultValue={1}
              />
            </Field>
            <Field label="Reason *">
              <TextArea
                name="reason"
                required
                rows={3}
                placeholder="e.g. Supplier delivery, sale, stock count…"
              />
            </Field>
            <p className="hint">
              Every adjustment is timestamped and saved in movement history.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-footer">
              <Button type="button" className="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                Save adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "category" && (
        <Modal
          title={category ? "Rename category" : "Add category"}
          close={close}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = String(
                new FormData(e.currentTarget).get("name"),
              ).trim();
              run(async () => {
                if (!name) throw Error("Category name is required.");
                if (
                  categories.some(
                    (c) =>
                      c.name.toLowerCase() === name.toLowerCase() &&
                      c.id !== category?.id,
                  )
                )
                  throw Error("That category already exists.");
                await db.categories.put({ id: category?.id || id(), name });
              }, "Category saved.");
            }}
          >
            <Field label="Category name *">
              <Input
                autoFocus
                name="name"
                required
                defaultValue={category?.name}
                placeholder="e.g. Workspace"
              />
            </Field>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-footer">
              <Button type="button" className="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                Save category
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppTheme>
      <App />
    </AppTheme>
  </React.StrictMode>,
);
