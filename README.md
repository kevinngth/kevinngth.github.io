# Homepage

The entry point that sits at the root of `<username>.github.io` and points at everything else.

## Adding a tool

Edit `tools.json`, push. That's the whole workflow.

```json
{
  "name": "thing",
  "desc": "One sentence. What it does, not how it works.",
  "href": "/thing/",
  "tags": ["cli"],
  "meta": "v1.0"
}
```

You never touch the HTML. The tag filter, the counts, and the search index are all
derived from this file at build time — add a tag nobody has used before and a new
chip appears for it automatically.

The finder (search field + tag chips) only renders once there are at least
`FINDER_MIN` tools — 6 by default, set at the top of `build.mjs`. Below that a
search box is furniture rather than help, so the page ships without it and the
script skips its own wiring.

`href` is usually `/repo-name/`, which is where a project site in the repo
`repo-name` lands once you enable Pages on it. External URLs work too.

Order in the file is order on the page. Put what you want seen first, first.

## Running it locally

```bash
npm run dev
```

Builds, serves on <http://localhost:8000>, watches `tools.json` and `src/`, and
**reloads the browser on save**. Pass a port if 8000 is taken: `node dev.mjs 8001`.

Needs Node 18+. There are still no dependencies and no lockfile — `package.json`
exists only to give the two commands short names.

A one-off build without the server:

```bash
npm run build
```

Note that `node build.mjs` on its own builds once and exits. Serving `dist/` with
something like `python3 -m http.server` will keep showing that one build until you
re-run it by hand — which is what `npm run dev` exists to avoid.

The live-reload snippet is injected into the HTTP response, never written to disk,
so `dist/index.html` is byte-identical to what gets deployed. If a build fails, the
last good page keeps being served and the error appears both in the terminal and as
an overlay in the browser.

## Deploying

`.github/workflows/pages.yml` builds and deploys on every push to `main`.
One-time setup: **Settings → Pages → Source: GitHub Actions**.

`dist/` is generated and gitignored; the workflow rebuilds it from source on every
push, so there is nothing to commit but `tools.json` and the template.

## How the filtering works

The entire tool list is rendered into the HTML at build time, so the page is
complete before any JavaScript runs — it works with JS disabled, and crawlers see
every tool. The filter is layered on top: it only ever hides rows that are already
there, and the search field stays hidden until JS confirms it can drive it.

Each row carries a precomputed lowercase `data-text` haystack (name + description
+ tags + version). Filtering is a substring test against that string, so it stays
instant well past a hundred tools without any index or dependency.

- Type to filter. Every word must match somewhere in the row (AND, not OR).
- Click tags to narrow further. Multiple tags AND together.
- `/` or `⌘K` focuses the field, `↑`/`↓` walk the results, `Enter` opens the
  highlighted one, `Esc` clears.
- Filters are mirrored into the URL, so `?q=cli` or `?t=web,design` is a
  shareable link to a filtered view.

If the list ever gets long enough that scrolling is the problem rather than
finding, the next step is grouping by tag when no filter is active — the data
already supports it.

## Day / night switching

Three states, not two — the control in the top right is **System / Light / Dark**.
A plain light-dark toggle strands people who just want the page to follow their OS,
so "System" stays a first-class option and is the default.

- The choice is stored in `localStorage` under `theme` (removed entirely when set
  back to System, so no leftover state).
- A short script in `<head>` applies a stored choice **before first paint**, so
  reloading never flashes the wrong theme.
- An explicit choice beats the OS in both directions: Light on a dark system stays
  light, and vice versa. That's what the `:not([data-theme="light"])` guard on the
  generated media query is for.
- While on System, the page follows live OS changes via a `matchMedia` listener.
- `<meta name="theme-color">` is kept in step so mobile browser chrome matches.
- Without JavaScript the control is hidden and the page follows the OS — same
  progressive-enhancement rule as the filter.

**Editing the palettes:** light tokens live in `:root`, dark tokens in
`:root[data-theme="dark"]`. Write dark values *once* in that block — `build.mjs`
mirrors it into a `prefers-color-scheme` media query at build time so the two can
never drift apart. Editing `src/template.html` and opening it directly (without
building) is fine for the explicit choices, but System-dark won't apply until you
run the build.

## Things worth knowing

**No personal information is on this page by design.** No name, no email, no
location. The only identifying string is the GitHub URL in `tools.json` →
`links`, which is the same username already in the site's domain. Delete that
entry if you want even that gone.

**Fonts come from Google Fonts.** That's a third-party request from every
visitor's browser. To make the page fully self-contained, download the Fraunces
and DM Sans woff2 files into `src/fonts/`, replace the `<link>` in
`src/template.html` with `@font-face` rules, and have `build.mjs` copy the
directory into `dist/`.

**Repo name becomes the URL path.** A tool in the repo `tabsnap` is served at
`<username>.github.io/tabsnap/`. Renaming the repo breaks every link you've
shared, so name them deliberately.

**A custom domain on this repo cascades.** Point one at this site and every
project site under the same account moves to `yourdomain.com/<repo>/`
automatically, with no per-repo DNS work.
