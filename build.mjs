#!/usr/bin/env node
/**
 * Renders tools.json + src/template.html -> dist/index.html
 *
 * Zero dependencies. The whole tool list is baked into the HTML at build time,
 * so the page works with JavaScript disabled and is readable by crawlers;
 * the filter UI is layered on top as progressive enhancement.
 *
 * Run directly (`node build.mjs`) or import `build()` — dev.mjs does the latter
 * so a rebuild costs nothing but a function call.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const p = (...s) => resolve(root, ...s);

/* Below this many tools, a search field and tag chips are furniture rather than
   help — so the finder isn't rendered at all until the list earns it. */
const FINDER_MIN = 6;

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function build() {
  /* ---------------------------------------------------------------- read */

  let data;
  try {
    data = JSON.parse(readFileSync(p("tools.json"), "utf8"));
  } catch (err) {
    throw new Error(`tools.json is not valid JSON — ${err.message}`);
  }

  const tools = data.tools ?? [];
  const links = data.links ?? [];

  if (!tools.length) throw new Error("tools.json has no tools — nothing to build.");

  for (const [i, t] of tools.entries()) {
    for (const key of ["name", "desc", "href"]) {
      if (!t[key]) {
        throw new Error(`tools[${i}] (${t.name ?? "unnamed"}) is missing "${key}".`);
      }
    }
  }

  /* ----------------------------------------------------------- transform */

  // Tag vocabulary is derived from the data — never hand-maintained.
  const counts = new Map();
  for (const t of tools) for (const tag of t.tags ?? []) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const tags = [...counts.keys()].sort((a, b) =>
    counts.get(b) - counts.get(a) || a.localeCompare(b)
  );

  const rowsHTML = tools.map((t) => {
    const tagList = t.tags ?? [];
    // One lowercase haystack per row: the filter reads this attribute, not the DOM.
    const haystack = [t.name, t.desc, ...tagList, t.meta ?? ""].join(" ").toLowerCase();
    const chips = tagList.map((g) => `<span class="tg">${esc(g)}</span>`).join("");
    const meta = t.meta ? `<span class="mt">${esc(t.meta)}</span>` : "";

    return `      <li class="row" data-tags="${esc(tagList.join(" "))}" data-text="${esc(haystack)}">
        <a href="${esc(t.href)}">
          <span class="nm">${esc(t.name)}</span>
          <span class="ds">${esc(t.desc)}</span>
          <span class="aside">${chips}${meta}</span>
        </a>
      </li>`;
  }).join("\n");

  const tagsHTML = tags.map((g) =>
    `<button type="button" data-tag="${esc(g)}" aria-pressed="false">${esc(g)}<span class="n">${counts.get(g)}</span></button>`
  ).join("\n      ");

  const linksHTML = links.map((l) =>
    `<a href="${esc(l.href)}">${esc(l.label)}</a>`
  ).join("\n    ");

  /* -------------------------------------------------------------- render */

  let html = readFileSync(p("src/template.html"), "utf8");

  for (const marker of ["<!--TOOLS-->", "<!--TAGS-->", "<!--LINKS-->", "<!--COUNT-->"]) {
    if (!html.includes(marker)) {
      throw new Error(`src/template.html is missing the ${marker} placeholder.`);
    }
  }

  html = html
    .replace("<!--TOOLS-->", "\n" + rowsHTML + "\n    ")
    .replace("<!--TAGS-->", "\n      " + tagsHTML + "\n    ")
    .replace("<!--LINKS-->", linksHTML + "\n    ")
    .replace("<!--COUNT-->", String(tools.length));

  // Drop the finder entirely for a short list. The page script notices it's gone
  // and skips its own wiring, so there is nothing to keep in sync.
  const finder = html.match(/[ \t]*<!--FINDER:START-->[\s\S]*?<!--FINDER:END-->\n?/);
  if (!finder) throw new Error("src/template.html is missing the FINDER markers.");
  const showFinder = tools.length >= FINDER_MIN;
  html = html.replace(finder[0], showFinder
    ? finder[0]
        .replace(/[ \t]*<!--FINDER:START-->\n/, "")
        .replace(/[ \t]*<!--FINDER:END-->\n?/, "")
    : "");

  /*
   * The dark palette is written once in the template, under :root[data-theme="dark"].
   * Mirror it into a prefers-color-scheme query so the "System" setting works —
   * guarded with :not([data-theme="light"]) so an explicit Light choice still wins
   * on a dark OS. Generating it here means the two blocks can never drift apart.
   */
  const darkBlock = html.match(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/);
  if (!darkBlock || !html.includes("/*!SYSTEM-DARK*/")) {
    throw new Error('src/template.html is missing the dark token block or the /*!SYSTEM-DARK*/ marker.');
  }
  html = html.replace(
    "/*!SYSTEM-DARK*/",
    `@media (prefers-color-scheme: dark){\n  :root:not([data-theme="light"]){${
      darkBlock[1].replace(/\n {2}/g, "\n    ").trimEnd()
    }\n  }\n}`
  );

  /* --------------------------------------------------------------- write */

  rmSync(p("dist"), { recursive: true, force: true });
  mkdirSync(p("dist"), { recursive: true });
  writeFileSync(p("dist/index.html"), html);
  writeFileSync(p("dist/.nojekyll"), "");

  return { count: tools.length, tags, finder: showFinder };
}

/* Only run when invoked directly, not when dev.mjs imports build(). */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const r = build();
    const note = r.finder ? "" : ` — finder hidden below ${FINDER_MIN} tools`;
    console.log(`Built dist/index.html — ${r.count} tools, ${r.tags.length} tags (${r.tags.join(", ")})${note}.`);
  } catch (err) {
    console.error(`Build failed: ${err.message}`);
    process.exit(1);
  }
}
