# EliteFuel Dev Notes

## Normal Local Start

Use the normal dev server when styles and generated files are behaving:

```bash
npm run dev
```

The app runs at:

```bash
http://localhost:3000
```

## Clean Local Start

Use this when the app shows raw HTML, missing Tailwind styling, stale route chunks, or missing generated Next files:

```bash
npm run dev:clean
```

This removes local Next/TypeScript build artifacts, regenerates the Prisma client, and starts `next dev`.

`npm run typecheck` uses `tsconfig.typecheck.json` so source checks do not depend on stale generated files under `.next/types` or `.next-build/types`. `npm run build` uses the standard `.next` output for Vercel compatibility. Use `npm run build:local` if you want a separate `.next-build` output while testing locally.

## If Styles Disappear

1. Stop the running dev server.
2. Run `npm run dev:clean`.
3. Reload the browser at `http://localhost:3000`.

The Tailwind setup is intentionally standard:

- `app/layout.tsx` imports `app/globals.css`.
- `tailwind.config.ts` scans `app`, `components`, and `lib`.
- `postcss.config.js` runs Tailwind CSS and Autoprefixer.
