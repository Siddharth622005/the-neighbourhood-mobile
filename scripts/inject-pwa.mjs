/**
 * Adds the install-to-home-screen tags to the exported web build.
 *
 * Expo's `web.output: "single"` generates index.html from its own
 * template and ignores app/+html.tsx (that hook only runs for "static"
 * rendering, which needs @expo/metro-runtime and would try to render the
 * whole app in Node — the Supabase client is constructed at module scope,
 * so that isn't safe here). Injecting after export is the reliable way to
 * get a manifest and the Apple meta tags in.
 *
 * Without these, "Add to Home Screen" produces a bookmark with a generic
 * icon that opens in a browser tab. With them it gets the real icon, the
 * app name, and no browser chrome.
 *
 * Runs as part of the Vercel build — see vercel.json.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const INDEX = resolve(here, "../dist/index.html");

if (!existsSync(INDEX)) {
  console.error(`[inject-pwa] ${INDEX} not found — did expo export run?`);
  process.exit(1);
}

const TAGS = `
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#E8DDD1" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Neighbourhood" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
`;

let html = readFileSync(INDEX, "utf8");

if (html.includes('rel="manifest"')) {
  console.log("[inject-pwa] already present — nothing to do.");
  process.exit(0);
}

// viewport-fit=cover lets the cream background run into the notch and
// home-indicator areas rather than leaving white bars once installed.
html = html.replace(
  /(<meta name="viewport" content=")([^"]*)(")/,
  (_m, a, content, c) =>
    content.includes("viewport-fit") ? `${a}${content}${c}` : `${a}${content}, viewport-fit=cover${c}`
);

html = html.replace("</head>", `${TAGS}  </head>`);

writeFileSync(INDEX, html);
console.log("[inject-pwa] manifest + apple tags injected.");
