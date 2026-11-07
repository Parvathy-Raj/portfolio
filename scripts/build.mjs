// Build step run by Vercel on every deploy (`npm run build`).
// 1. Copies the static site into dist/.
// 2. Renders dist/og-image.png, the link preview shown on WhatsApp, LinkedIn, Slack, X, etc.
//    Colours and fonts are read from styles.css, so the image follows any theme change.
// Free, open-source tools only: Satori (layout to SVG) and resvg (SVG to PNG).

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { join } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const ROOT = process.cwd();
const OUT = join(ROOT, "dist");
const SITE_FILES = ["index.html", "styles.css", "script.js", "media"];

// ---------- 1. Copy the site ----------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const f of SITE_FILES) cpSync(join(ROOT, f), join(OUT, f), { recursive: true });

// ---------- 2. Read theme from styles.css ----------
const css = readFileSync(join(ROOT, "styles.css"), "utf8");

function readVars(block) {
  const vars = {};
  for (const [, name, value] of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[name] = value.trim();
  return vars;
}
const themeBlock = css.match(/\[data-theme="dark"\]\s*\{([^}]*)\}/);
const rootBlock = css.match(/:root\s*\{([^}]*)\}/);
if (!themeBlock || !rootBlock) throw new Error("Could not find theme tokens in styles.css");
const t = { ...readVars(rootBlock[1]), ...readVars(themeBlock[1]) }; // dark is the default theme

// First family in a font stack, e.g. '"Inter", system-ui' -> "Inter"
const family = (stack) => stack.split(",")[0].replace(/["']/g, "").trim();
const sans = family(t.font);
const mono = family(t.mono);

// Fonts come from the @fontsource npm packages (open-source, bundled at build time).
function font(name, weight) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const file = join(ROOT, "node_modules", "@fontsource", slug, "files", `${slug}-latin-${weight}-normal.woff`);
  return { name, weight, style: "normal", data: readFileSync(file) };
}
const fonts = [font(sans, 500), font(sans, 700), font(sans, 800), font(mono, 500)];

// ---------- 3. Lay out the card (1200 x 630) ----------
// Satori requires every box to declare its layout, so each one defaults to flex.
const h = (type, style, ...children) => ({
  type,
  props: { style: { display: "flex", ...style }, ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) },
});
const grad = `linear-gradient(135deg, ${t.a1} 0%, ${t.a2} 100%)`;

const card = h("div", {
    width: 1200, height: 630, display: "flex", flexDirection: "column",
    background: `linear-gradient(135deg, ${t["bg-2"]} 0%, ${t.bg} 55%, ${t["bg-3"]} 100%)`,
    fontFamily: sans, color: t.text,
  },
  h("div", { width: "100%", height: 10, background: grad }),
  h("div", { flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 90px" },
    // Left: text
    h("div", { display: "flex", flexDirection: "column", maxWidth: 700 },
      h("div", { display: "flex", alignItems: "center", marginBottom: 28 },
        h("div", { width: 44, height: 2, background: t.a2, marginRight: 16 }),
        h("div", { fontFamily: mono, fontSize: 22, letterSpacing: 5, color: t.a2 }, "AI ENGINEER"),
      ),
      h("div", { display: "flex", fontSize: 84, fontWeight: 800, color: t.heading, letterSpacing: -2, lineHeight: 1.05 }, "Parvathy Raj"),
      h("div", { display: "flex", fontSize: 36, fontWeight: 700, color: t.a1, marginTop: 18 }, "Building trustworthy AI systems"),
      h("div", { display: "flex", fontSize: 26, fontWeight: 500, color: t["text-2"], marginTop: 22, lineHeight: 1.45 },
        "Agentic AI, RAG systems and MCP servers, built with evaluation from day one."),
      h("div", { display: "flex", fontFamily: mono, fontSize: 22, color: t.muted, marginTop: 40 }, "parvathy-raj.vercel.app"),
    ),
    // Right: monogram
    h("div", {
        width: 250, height: 250, borderRadius: 125, background: grad, display: "flex",
        alignItems: "center", justifyContent: "center", boxShadow: `0 24px 60px ${t.glow}`,
      },
      h("div", { fontSize: 104, fontWeight: 800, color: t["on-accent"], letterSpacing: -4 }, "PR"),
    ),
  ),
);

const svg = await satori(card, { width: 1200, height: 630, fonts });
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
writeFileSync(join(OUT, "og-image.png"), png);
console.log(`og-image.png: ${(png.length / 1024).toFixed(0)} KB (fonts: ${sans}, ${mono}; accent ${t.a1} -> ${t.a2})`);
