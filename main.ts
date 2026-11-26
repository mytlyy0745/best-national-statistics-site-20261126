// NationStat hand-in program (Node 22, standard library only).
//
// Copies app/ and screenshots/ from beside this file to /output (or
// $MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json
// with the vendored make.fun library, so the judge can read the site.
// vendor/makefun-frontend.ts is the kit's copy, unchanged: the scorer
// requires dossier.json to be byte for byte what its own copy writes.
//
// Run it locally with:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// app/ is the whole site: plain static files, no build step.
mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });

// screenshots/ holds the four renders of the site running.
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// The dossier is what the judge reads: the site's first-load files and
// bytes, its source, and its screenshots. The caps mirror the gate:
// text at most 160 KiB, a screenshot at most 256 KiB, at most 4 of them,
// app/ at most 993 files and 16 MiB.
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

console.log("NationStat handed in to " + out);
