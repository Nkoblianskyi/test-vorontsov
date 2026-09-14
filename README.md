# Invoice Studio — invoice template settings

A working frontend demo of the scenario in the reference: an accountant edits how
invoices look — name, logo, colours, layout, wording — and sees the result on a real
A4 sheet while typing. Same meaning, same flow, different visual language.

```bash
npm install                # Node 20.9+ (see .nvmrc)
npm run dev                # http://localhost:3000 → redirects to /templates/standard
npm run build && npm start
npm run lint               # eslint flat config, next/core-web-vitals + typescript
npm run typecheck          # tsc --noEmit
npm run format             # prettier
```

`node_modules/` and `.next/` are not in the archive — they are generated. `package-lock.json`
is, so `npm install` reproduces the exact tree this was built and verified with.

## What the demo does

- **Live A4 preview** with zoom (fit / 50 / 75 / 100 %) — the sheet is measured in
  millimetres, not abstract card units, so the layout you approve is the layout that prints.
- **General tab** — presets, template name, brand / text / paper colours with a WCAG
  contrast read-out, logo upload (drag and drop, 512 KB cap, monogram fallback),
  typeface, text size, header layout, rule weight, spacing, accent band.
- **Content tab** — document title, currency, date format, column and totals toggles,
  terms and closing note with character counts, page footer.
- **Four presets** that change appearance only and never touch typed content.
- **Undo / redo** (⌘Z, ⇧⌘Z), **Revert** to the last saved state, **Save** (⌘S) through a
  server action, **Print or PDF** through the browser print dialog with a dedicated
  A4 print stylesheet.
- **Dark interface theme** — the sheet itself stays light in both themes, because it
  gets printed.

## Architecture

```
src/
  app/                       route layer only
    layout.tsx               fonts, pre-paint theme script
    templates/[id]/page.tsx  RSC: loads the record, hands it to the editor
    api/templates/[id]/      GET / PATCH for the same repository
  entities/invoice/          the document: types, sample data, totals, theming, UI
  features/template-customizer/
    model/                   zod schema, presets, editor store (RHF + history)
    ui/                      panel sections, preview stage, topbar
    actions/                 server action for saving
  server/                    repository (swap for Prisma/NestJS — nothing above changes)
  shared/                    ui primitives, colour maths, cn
```

**One schema, three consumers.** `templateConfigSchema` validates the form
(`zodResolver`), the server action, and the REST route. A field added to the schema
cannot silently bypass validation on one of the paths.

**The preview is a component, not an iframe or an image.**
`<InvoiceDocument config invoice />` has no client code, so it renders during SSR with
the saved configuration — the first paint already shows the real sheet, with no flash
of defaults — and the same component re-renders on every keystroke in the browser.

**Config → CSS custom properties.** `documentStyle()` turns the configuration into
variables on the sheet root (`--doc-brand`, `--doc-rule-width`, `--doc-pad`…). Colour and
spacing changes repaint through CSS instead of re-rendering the tree below.

**History is a stack of snapshots**, pushed 400 ms after the last edit, so dragging a
slider produces one undo step rather than forty. Undo restores through `form.reset`.

**Contrast is checked, not assumed.** `auditContrast` reports the WCAG ratio for text on
the brand block and body text on paper, and warns when a colour choice would ship an
unreadable invoice — the reference lets you pick white-on-yellow without a word.

## Visual direction

Swiss grid: hairline rules instead of shadows and rounded cards, black ink, one signal
colour (`#e1301a`) reserved for state — unsaved, revert, destructive — so it never
competes with the brand colour the user picks for their invoice. Identity element is the
colour band at the seam between panel and canvas, which doubles as the live brand-colour
indicator. Type is Archivo (variable, tabular figures) with Newsreader as the serif
document option; both are self-hosted, so an offline accounting workstation renders
identical output.

## Notes and limits

- The repository is in-memory: restarting the server resets the template. It is one file
  behind a stable async interface, so a real database is a drop-in change.
- Logos are stored as data URLs to keep the demo dependency-free. Production would upload
  to object storage and keep a URL in the record.
- Invoice data on the sheet is a fixture. This screen configures the template; issuing
  invoices is a different screen.
