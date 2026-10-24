# Stock On You ❤️‍🔥

A browser-local inventory app built with React, Vite, TypeScript, Material UI, Tailwind CSS, Lucide, and Dexie.

## Run locally

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Open the local URL printed in your terminal. Choose **Add product** to start or **Settings → Load sample data** to explore an empty inventory.

```sh
npm test
npm run build
npm run preview
```

Use the **Light mode / Dark mode** switch in the top bar to change appearance. Your preference stays in this browser.

## Keep stock accurate

Create categories from **Categories**. Add products with unique SKUs, prices, initial quantities, and low-stock thresholds. Initial stock creates a history entry automatically.

Use the arrows beside a product to add stock, remove stock, or correct the actual quantity. Enter a reason for each change. Stock cannot go below zero. Edit product details with the pencil button; quantity changes use adjustments.

Search by product name or SKU, filter by category or stock status, and sort by name, quantity, or value. Inventory value uses cost price. Archiving a product retains its history; restore it from **Settings → Archived products**. Categories containing active or archived products cannot be deleted.

## Back up or move your inventory

Data stays in this browser on this device, including after a refresh or browser restart. It does not sync between devices or browser profiles. Private browsing, clearing site data, or changing the site's address can make your inventory unavailable. The page needs a network connection to load; offline launching is not provided.

Export JSON backups regularly from **Settings** and save them somewhere safe. To move data, open the app on your other browser or device and choose **Restore JSON backup**. Restore validates the file and asks before replacing all existing data. Export your current inventory before restoring another backup. Invalid files leave existing data intact. Maximum backup size: 20 MB.

Currency changes the display format; it does not convert stored prices.

## Deploy to Cloudflare Workers

```sh
npx wrangler login
npm run deploy
```

The included `wrangler.jsonc` serves `dist` as a static single-page app named `mscs-stockroom`. No backend, database service, API keys in source, or paid services are required. The deployment command prints your live URL.

Animated icons are provided by [Lordicon](https://lordicon.com/) through its official React player and CDN. They play on hover or keyboard focus. Reduced-motion preferences use static icons, and unavailable animations fall back to Lucide.

## Source layout

- `src/db.ts`: IndexedDB schema, validated product operations, atomic stock/history updates, backups, sample data.
- `src/AnimatedIcon.tsx`: Lordicon embeds, inherited theme colors, and static fallbacks.
- `src/ui.tsx`: Material UI theme and reusable controls, dialogs, fields, feedback, stock badges.
- `src/main.tsx`: dashboard, products, movements, categories, settings and responsive navigation.
- `src/style.css`: layout, responsive cards/table, focus and motion preferences.
- `src/db.test.ts`: database rules, rollback, backup validation, restore, archive, and persistence checks using an isolated in-memory IndexedDB.
