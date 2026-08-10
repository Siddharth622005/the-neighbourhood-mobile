/**
 * Generates the activities seed migration from content/activity_library.csv
 * (1,149 activities across 28 three-month age bands and 7 developmental
 * areas) — the replacement content source for the `activities` table,
 * superseding the 56 activities in lib/todaysPlan.ts.
 *
 * A separate script from gen-seed.mjs, deliberately: gen-seed.mjs's output
 * (20260726092000_seed_content.sql) is already applied to the remote
 * project, and Supabase skips already-applied migration versions on push
 * regardless of local content changes — editing that file wouldn't reach
 * the remote. This writes a NEW, later-timestamped migration instead.
 *
 *   node scripts/gen-activity-library-seed.mjs
 *
 * Re-running after a CSV edit regenerates the SAME output file in place
 * (safe: it hasn't been pushed yet), until it has been applied remotely —
 * after that, a further content edit needs its own new-timestamped file,
 * same as any other migration.
 *
 * Maps the CSV's 7 areas onto the app's existing 4-domain model (Motor /
 * Communication / Cognitive / Social & Emotional), which the daily_plans
 * schema, the Home "4 activities a day" UI, and milestones all assume and
 * were deliberately left unchanged:
 *   Gross Motor, Fine Motor        -> motor
 *   Language & Communication       -> communication
 *   Cognitive, Sensory             -> cognitive
 *   Social-Emotional,
 *   Self-Care & Adaptive           -> social_emotional
 *     (Self-Care & Adaptive groups with Social-Emotional the same way
 *     Denver II groups personal-social with self-help skills.)
 *
 * Age bands are widened rather than collapsed — see
 * 20260808100000_widen_activity_bands.sql — so all 28 of the CSV's bands
 * are kept, not re-bucketed into the original 7.
 *
 * WHAT / HOW / WHY split (added for the Home redesign that stopped
 * showing the same "How To Do It" sentence twice — once as the preview
 * description, once again under HOW): the CSV only ever gives one blob of
 * text per activity, so this mechanically splits it on sentence
 * boundaries rather than inventing content that isn't there.
 *   1 sentence  -> why = that sentence; instructions = the same sentence
 *                  (nothing else exists to show); benefit = null.
 *   2 sentences -> why = first; instructions = second; benefit = null.
 *   3+ sentences -> why = first; instructions = the middle sentence(s);
 *                  benefit = last (in this content, the closing sentence
 *                  is consistently the rationale — "...helps them control
 *                  speed and direction", "...builds the script for real
 *                  situations").
 * When benefit ends up null, home.tsx falls back to one honest, generic
 * sentence per developmental domain rather than a per-activity guess.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const CSV_PATH = resolve(root, "content/activity_library.csv");
// 20260808120000_seed_activity_library.sql (the original target of this
// script) is already applied remotely, so this content change — splitting
// why/instructions/benefit apart — needs its own new-timestamped file,
// same as any other migration once the previous one has shipped.
const OUT = "supabase/migrations/20260810091000_split_activity_why_how_benefit.sql";

const AREA_TO_DOMAIN = {
  "Gross Motor": "motor",
  "Fine Motor": "motor",
  Cognitive: "cognitive",
  "Language & Communication": "communication",
  "Social-Emotional": "social_emotional",
  Sensory: "cognitive",
  "Self-Care & Adaptive": "social_emotional",
};

const DOMAINS = ["motor", "communication", "cognitive", "social_emotional"];

// ---------------------------------------------------------------------
// Minimal CSV parser — handles quoted fields with embedded commas and
// doubled ("") quotes, which this file uses throughout. No external
// dependency, matching gen-seed.mjs's dependency-free convention.
// ---------------------------------------------------------------------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // skip
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const q = (v) =>
  v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`;

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** "0–3 months" → { band: "m0_3", lowerMonths: 0 }. "3y3m–3y6m" → { band: "y3_3", lowerMonths: 39 }. */
function parseAgeBand(label) {
  const monthsMatch = label.match(/^(\d+)–(\d+) months$/);
  if (monthsMatch) {
    return { band: `m${monthsMatch[1]}_${monthsMatch[2]}`, lowerMonths: Number(monthsMatch[1]) };
  }
  const start = label.split("–")[0];
  const yearMatch = start.match(/^(\d+)y(\d+)?m?$/);
  if (!yearMatch) throw new Error(`cannot parse age band "${label}" (start token "${start}")`);
  const years = Number(yearMatch[1]);
  const monthsPart = yearMatch[2] ? Number(yearMatch[2]) : 0;
  return { band: `y${years}_${monthsPart}`, lowerMonths: years * 12 + monthsPart };
}

/**
 * Splits on sentence-ending punctuation, keeping it attached to each piece.
 * Quote-aware: several activities embed a short line of dialogue in single
 * quotes (e.g. "During play: 'You have 4 blocks. Can you give me 2?' Guided
 * sharing builds..."), and splitting mid-quote produced dangling fragments
 * like a lone trailing apostrophe. Sentence terminators inside an open
 * quote don't count as a boundary.
 */
function splitSentences(text) {
  const sentences = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    current += ch;
    if (ch === "'") inQuote = !inQuote;
    if (!inQuote && /[.!?]/.test(ch) && !/[.!?]/.test(text[i + 1] ?? "")) {
      sentences.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) sentences.push(current.trim());
  return sentences.filter(Boolean);
}

/** See the WHAT/HOW/WHY comment at the top of this file. */
function splitWhatHowWhy(text) {
  const sentences = splitSentences(text);
  if (sentences.length <= 1) {
    return { why: text, instructions: text, benefit: null };
  }
  if (sentences.length === 2) {
    return { why: sentences[0], instructions: sentences[1], benefit: null };
  }
  return {
    why: sentences[0],
    instructions: sentences.slice(1, -1).join("\n"),
    benefit: sentences[sentences.length - 1],
  };
}

/** "5–10" → { minutes: 8, label: "5–10 min" }. "Ongoing" → { minutes: null, label: "Ongoing" }. */
function parseDuration(raw) {
  const trimmed = raw.trim();
  if (/^ongoing$/i.test(trimmed)) return { minutes: null, label: "Ongoing" };
  const rangeMatch = trimmed.match(/^(\d+)–(\d+)$/);
  if (rangeMatch) {
    const lo = Number(rangeMatch[1]);
    const hi = Number(rangeMatch[2]);
    return { minutes: Math.round((lo + hi) / 2), label: `${lo}–${hi} min` };
  }
  const single = trimmed.match(/^(\d+)$/);
  if (single) return { minutes: Number(single[1]), label: `${single[1]} min` };
  throw new Error(`cannot parse duration "${raw}"`);
}

// ---------------------------------------------------------------------
// Read + transform
// ---------------------------------------------------------------------
const csvText = readFileSync(CSV_PATH, "utf8");
const table = parseCsv(csvText);
const header = table[0];
const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

const activities = [];
const seenIds = new Set();
for (const row of table.slice(1)) {
  if (row.every((c) => c === "")) continue; // trailing blank line
  const title = row[col["Activity Name"]].trim();
  const howTo = row[col["How To Do It"]].trim();
  const area = row[col["Developmental Area"]].trim();
  const durationRaw = row[col["Duration (min)"]].trim();
  const materials = row[col["Materials Required"]].trim();
  const ageBandLabel = row[col["Age Band"]].trim();

  const domain = AREA_TO_DOMAIN[area];
  if (!domain) throw new Error(`unmapped developmental area "${area}" for "${title}"`);

  const { band } = parseAgeBand(ageBandLabel);
  const { minutes, label: durationLabel } = parseDuration(durationRaw);

  const id = `${slug(title)}-${band}`;
  if (seenIds.has(id)) throw new Error(`duplicate activity id "${id}"`);
  seenIds.add(id);

  const { why, instructions, benefit } = splitWhatHowWhy(howTo);

  activities.push({
    id,
    domain,
    age_band: band,
    title,
    why,
    duration_minutes: minutes,
    duration_label: durationLabel,
    materials: materials || "None",
    instructions,
    benefit,
  });
}

// ---------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------
const lines = [];
lines.push("-- GENERATED by scripts/gen-activity-library-seed.mjs — do not edit by hand.");
lines.push("-- Regenerate after a content edit:  node scripts/gen-activity-library-seed.mjs");
lines.push("--");
lines.push(`-- Replaces the activities seeded by 20260726092000_seed_content.sql (the`);
lines.push(`-- original 56, from lib/todaysPlan.ts) with ${activities.length} activities from`);
lines.push("-- content/activity_library.csv, across 28 age bands. Requires");
lines.push("-- 20260808100000_widen_activity_bands.sql and");
lines.push("-- 20260808110000_fine_grained_age_band_for.sql to have already run.");
lines.push("--");
lines.push("-- Idempotent: the delete removes anything not in this content set (which");
lines.push("-- includes the old 56), the insert upserts everything in it.");
lines.push("");

lines.push(`delete from activities where id not in (${activities.map((a) => q(a.id)).join(", ")});`);
lines.push(
  "insert into activities (id, domain, age_band, title, why, duration_minutes, duration_label, materials, instructions, benefit) values"
);
lines.push(
  activities
    .map(
      (a) =>
        `  (${q(a.id)}, ${q(a.domain)}::domain, ${q(a.age_band)}::age_band, ${q(a.title)}, ${q(a.why)}, ${a.duration_minutes ?? "null"}, ${q(a.duration_label)}, ${q(a.materials)}, ${q(a.instructions)}, ${q(a.benefit)})`
    )
    .join(",\n")
);
lines.push(
  "on conflict (id) do update set domain = excluded.domain, age_band = excluded.age_band, title = excluded.title, why = excluded.why, duration_minutes = excluded.duration_minutes, duration_label = excluded.duration_label, materials = excluded.materials, instructions = excluded.instructions, benefit = excluded.benefit;"
);
lines.push("");

writeFileSync(resolve(root, OUT), lines.join("\n") + "\n");
console.log(`wrote ${OUT} (${activities.length} activities)`);

// ---------------------------------------------------------------------
// Coverage report — the invariant swap logic depends on: every
// (age_band, domain) pair needs at least 2 activities.
// ---------------------------------------------------------------------
const bandsInOrder = [];
const seenBands = new Set();
for (const a of activities) {
  if (!seenBands.has(a.age_band)) {
    seenBands.add(a.age_band);
    bandsInOrder.push(a.age_band);
  }
}

const report = {};
for (const b of bandsInOrder) report[b] = Object.fromEntries(DOMAINS.map((d) => [d, 0]));
for (const a of activities) report[a.age_band][a.domain] += 1;

console.log("\nband       motor   comm    cog  social   total");
let anyUnder2 = false;
for (const b of bandsInOrder) {
  const row = report[b];
  const total = DOMAINS.reduce((s, d) => s + row[d], 0);
  console.log(
    b.padEnd(10) + DOMAINS.map((d) => String(row[d]).padStart(7)).join("") + `  ${total}`
  );
  for (const d of DOMAINS) {
    if (row[d] < 2) {
      anyUnder2 = true;
      console.log(`  ! ${b}/${d} has only ${row[d]} — swap has nothing to swap to`);
    }
  }
}
if (!anyUnder2) console.log("\nEvery (band, domain) pair has >= 2 activities — swap is safe everywhere.");
