// Regenerates presentation-deck.pptx from the same screenshots embedded in
// presentation-deck.html (see that file's own build notes for how they were
// captured). Run from this directory: `npm install pptxgenjs && node build-pptx.js`.
const pptxgen = require("pptxgenjs");
const path = require("path");

const A = path.join(__dirname, "pptx-assets/");
const img = (k) => A + k + ".jpg";

// ---- brand palette, pulled directly from presentation-deck.html ----
const C = {
  ground: "F3EEE7",
  groundPeople: "E2D7C6",
  surface: "FFFDFC",
  ink: "2C2C2C",
  inkSoft: "6A6157",
  inkFaint: "9C9184",
  primary: "89745B", // taupe
  accent: "B4553F",  // terracotta
  positive: "6F8A73", // sage
  rule: "D9D2C4",
  shadowColor: "4A3323",
};

const SERIF = "Cambria";     // safe-list stand-in for Playfair Display
const BODY = "Calibri";      // safe-list stand-in for Karla
const MONO = "Consolas";     // QA-unreliable widths but fine for short caps labels

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
const PW = 13.333, PH = 7.5;

function baseSlide(bg) {
  const s = pres.addSlide();
  s.background = { color: bg || C.ground };
  return s;
}

function pageNum(s, n, total, dark) {
  s.addText(String(n).padStart(2, "0") + " / " + String(total).padStart(2, "0"), {
    x: 0.5, y: PH - 0.55, w: 2, h: 0.3,
    fontFace: MONO, fontSize: 9, color: dark ? "FFFFFF" : C.inkFaint,
    align: "left", margin: 0,
  });
}

function kicker(s, text, opts) {
  s.addText(text.toUpperCase(), Object.assign({
    x: 0.7, y: 0.5, w: 8, h: 0.35,
    fontFace: BODY, bold: true, fontSize: 11, color: C.primary,
    charSpacing: 2, align: "left", margin: 0,
  }, opts || {}));
}

function heading(s, text, opts) {
  s.addText(text, Object.assign({
    x: 0.7, y: 0.85, w: 10.5, h: 1.1,
    fontFace: SERIF, fontSize: 34, color: C.ink,
    align: "left", margin: 0,
  }, opts || {}));
}

// A card with a title + body, used for the 5-thing and 6-decision grids.
function card(s, x, y, w, h, title, body, standout) {
  s.addShape("rect", {
    x, y, w, h,
    fill: { color: standout ? C.surface : C.surface },
    line: { color: standout ? C.accent : C.rule, width: standout ? 1.5 : 0.75 },
    shadow: { type: "outer", color: C.shadowColor, opacity: 0.18, blur: 6, offset: 2, angle: 90 },
  });
  s.addText(title, {
    x: x + 0.18, y: y + 0.14, w: w - 0.36, h: 0.35,
    fontFace: BODY, bold: true, fontSize: 13.5, color: standout ? C.primary : C.ink,
    align: "left", margin: 0,
  });
  s.addText(body, {
    x: x + 0.18, y: y + 0.5, w: w - 0.36, h: h - 0.66,
    fontFace: BODY, fontSize: 10.5, color: C.inkSoft, align: "left",
    valign: "top", margin: 0, lineSpacingMultiple: 1.15,
  });
}

function cardGrid(s, items, x0, y0, totalW, totalH, cols) {
  const gap = 0.16;
  const rows = Math.ceil(items.length / cols);
  const cw = (totalW - gap * (cols - 1)) / cols;
  const ch = (totalH - gap * (rows - 1)) / rows;
  items.forEach((it, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    card(s, x0 + c * (cw + gap), y0 + r * (ch + gap), cw, ch, it.title, it.body, it.standout);
  });
}

// An image + small caption block, used for the three screenshot slides.
//
// Sized from a target HEIGHT, not a target width: these are portrait phone
// screenshots (ratioWH well under 1), and a column-width-first layout backs
// into a height that blows through the slide's 7.5in bottom edge long
// before it fills the column. Deriving width from a height that's known to
// fit is the only order that stays inside the slide regardless of how
// narrow the resulting image ends up. The image centers in its column;
// the label and caption still span the full column so they stay legible.
function shot(s, colX, colW, y, targetH, imgPath, ratioWH, label, caption, capH) {
  const w = targetH * ratioWH;
  const x = colX + (colW - w) / 2;
  s.addImage({ path: imgPath, x, y, w, h: targetH });
  s.addShape("rect", { x, y, w, h: targetH, fill: { type: "none" }, line: { color: C.rule, width: 0.75 } });
  s.addText(label.toUpperCase(), {
    x: colX, y: y + targetH + 0.08, w: colW, h: 0.22,
    fontFace: BODY, bold: true, fontSize: 8.5, color: C.primary, charSpacing: 1, margin: 0,
  });
  s.addText(caption, {
    x: colX, y: y + targetH + 0.3, w: colW, h: capH || 0.6,
    fontFace: BODY, fontSize: 9, color: C.inkSoft, margin: 0, valign: "top", lineSpacingMultiple: 1.12,
  });
}

function statTile(s, x, y, w, h, big, label) {
  s.addShape("rect", {
    x, y, w, h,
    fill: { color: C.surface }, line: { color: C.rule, width: 0.75 },
    shadow: { type: "outer", color: C.shadowColor, opacity: 0.16, blur: 5, offset: 2, angle: 90 },
  });
  s.addText(big, {
    x: x + 0.16, y: y + 0.08, w: w - 0.32, h: h * 0.5,
    fontFace: MONO, bold: true, fontSize: 24, color: C.ink, margin: 0, valign: "bottom",
  });
  s.addText(label, {
    x: x + 0.16, y: y + h * 0.58, w: w - 0.32, h: h * 0.4,
    fontFace: BODY, fontSize: 9, color: C.inkSoft, margin: 0, valign: "top", lineSpacingMultiple: 1.1,
  });
}

function tagChip(s, x, y, text, color) {
  const w = 0.1 * text.length / 1.6 + 0.3;
  s.addShape("rect", {
    x, y, w, h: 0.3,
    fill: { type: "none" }, line: { color, width: 1 },
  });
  s.addText(text.toUpperCase(), {
    x, y, w, h: 0.3, fontFace: MONO, bold: true, fontSize: 8.5, color,
    align: "center", valign: "middle", charSpacing: 1, margin: 0,
  });
  return w;
}

const TOTAL = 11;

// ===================== SLIDE 1 — Title / Mission =====================
{
  const s = baseSlide(C.ground);
  s.addText([
    { text: "Two months.", options: { breakLine: true } },
    { text: "A website", options: { breakLine: true } },
    { text: "and an app.", options: {} },
  ], {
    x: 0.7, y: 0.9, w: 9, h: 3.0,
    fontFace: SERIF, fontSize: 54, color: C.ink, lineSpacingMultiple: 1.0, margin: 0,
  });
  s.addText(
    "The Neighbourhood exists to turn everyday moments into meaningful childhood memories, with as little friction as possible.",
    {
      x: 0.7, y: 4.05, w: 7.6, h: 1.1,
      fontFace: BODY, fontSize: 18, color: C.ink, margin: 0, lineSpacingMultiple: 1.25,
    }
  );
  s.addText("SIDDHARTH  ·  THE NEIGHBOURHOOD  ·  22 JUNE TO 22 AUGUST 2026", {
    x: 0.7, y: 5.35, w: 9, h: 0.35,
    fontFace: MONO, fontSize: 11, color: C.inkFaint, charSpacing: 1, margin: 0,
  });
  pageNum(s, 1, TOTAL);
}

// ===================== SLIDE 2 — More than Home =====================
{
  const s = baseSlide(C.ground);
  kicker(s, "What we're building");
  heading(s, "More than Home.");
  const cards2 = [
    { title: "Home", body: "Four development activities a day, one each for motor, communication, cognitive, and social skills." },
    { title: "Community", body: "Real parents at a similar stage. Questions, answers, and moderation built in." },
    { title: "Ask", body: "An AI that knows the child's age and the parent's own situation. One assistant, two audiences." },
    { title: "Child", body: "137 milestones, a full vaccination schedule, meal planning, and a development kit." },
    { title: "You", body: "The parent's own recovery, nutrition, and mental health. Not an afterthought. A whole side of the app." },
  ];
  cardGrid(s, cards2, 0.7, 2.05, 11.9, 3.1, 3);
  s.addText(
    "Home is the daily habit, the reason to open the app again tomorrow. The other four are why it's worth keeping open.",
    { x: 0.7, y: 5.35, w: 10.5, h: 0.6, fontFace: BODY, fontSize: 12.5, color: C.inkSoft, margin: 0, lineSpacingMultiple: 1.2 }
  );
  pageNum(s, 2, TOTAL);
}

// ===================== SLIDE 3 — The website, week by week =====================
{
  const s = baseSlide(C.ground);
  heading(s, "The website, week by week", { y: 0.55, fontSize: 32 });
  const items = [
    { k: "web1", label: "12 July", cap: "First version. Grey-brown, handprints, text on the left." },
    { k: "web2", label: "23 July", cap: "Rebuilt the layout. More space, softer shapes." },
    { k: "web3", label: "2 August", cap: "New colours. Cream and terracotta. Moved to the centre." },
    { k: "web4", label: "21 August", cap: "Live now. Serif headline, one word in orange." },
  ];
  const gap = 0.25, x0 = 0.7, y0 = 1.7, totalW = PW - 1.4;
  const colW = (totalW - gap * 3) / 4;
  const imgH = 1.75; // fits: 1.7 + 1.75 + 0.85(label+caption) = 4.3, well clear of the trailing paragraph at 5.55
  items.forEach((it, i) => {
    shot(s, x0 + i * (colW + gap), colW, y0, imgH, img(it.k), 1100 / 688, it.label, it.cap, 0.55);
  });
  s.addText(
    "Same sentence the whole way through. It took four goes to find the right way to say it. At one point I had four versions running at once, so I picked one and deleted the other three.",
    { x: 0.7, y: 5.55, w: 10.8, h: 0.9, fontFace: BODY, fontSize: 12.5, color: C.inkSoft, margin: 0, lineSpacingMultiple: 1.25 }
  );
  pageNum(s, 3, TOTAL);
}

// ===================== SLIDE 4 — It only asks what applies to you =====================
{
  const s = baseSlide(C.ground);
  heading(s, "It only asks what applies to you", { y: 0.55, fontSize: 30 });
  const items = [
    { k: "app2", label: "Your name", cap: "The app talks to you by name after this." },
    { k: "app5", label: "Who you are", cap: "Decides which questions you see next, and skips the ones that don't apply." },
    { k: "app3", label: "Birthday", cap: "The most important one. Everything is worked out from this." },
    { k: "app6", label: "Birth type", cap: "Only for mothers. A father never sees this screen." },
    { k: "app7", label: "Feeding", cap: "Only in the first year. Skipped once it stops being relevant." },
    { k: "app4", label: "Gender", cap: "Three options. One of them is prefer not to say." },
  ];
  const gap = 0.22, x0 = 0.7, y0 = 1.55, totalW = PW - 1.4;
  const colW = (totalW - gap * 2) / 3;
  const imgH = 1.65, rowGap = 0.15, labelBlock = 0.85; // row = imgH + labelBlock; two rows must clear ~5.35in of budget
  const rowH = imgH + labelBlock + rowGap;
  items.forEach((it, i) => {
    const r = Math.floor(i / 3), c = i % 3;
    shot(s, x0 + c * (colW + gap), colW, y0 + r * rowH, imgH, img(it.k), 460 / 644, it.label, it.cap, 0.55);
  });
  pageNum(s, 4, TOTAL);
}

// ===================== SLIDE 5 — Then it gets to work =====================
{
  const s = baseSlide(C.ground);
  kicker(s, "The app, signed in");
  heading(s, "Then it gets to work", { y: 0.85, fontSize: 32 });
  const items = [
    { k: "live1", label: "Home", cap: "Today's four things, one per domain." },
    { k: "live2", label: "Child", cap: "Today's progress, plus discoveries and vaccinations." },
    { k: "live3", label: "You", cap: "The parent's own side. Cooler colours, on purpose." },
    { k: "live4", label: "Ask", cap: "Questions, answered." },
  ];
  const gap = 0.3, x0 = 0.7, y0 = 1.9, totalW = PW - 1.4;
  const colW = (totalW - gap * 3) / 4;
  const imgH = 2.9; // row ends at 1.9 + 2.9 + 0.82(label+caption) = 5.62, clear of the trailing paragraph
  items.forEach((it, i) => {
    shot(s, x0 + i * (colW + gap), colW, y0, imgH, img(it.k), 440 / 924, it.label, it.cap, 0.5);
  });
  s.addText(
    "The bit I'm most proud of is You. Every other parenting app is about the child only. But the parent is recovering too, and nobody asks how they are. So they get their own half of the app.",
    { x: 0.7, y: 5.85, w: 11.2, h: 0.8, fontFace: BODY, fontSize: 12.5, color: C.inkSoft, margin: 0, lineSpacingMultiple: 1.22 }
  );
  pageNum(s, 5, TOTAL);
}

// ===================== SLIDE 6 — Six decisions behind it =====================
{
  const s = baseSlide(C.ground);
  kicker(s, "How we decided what to build");
  heading(s, "Six decisions behind it");
  const cards6 = [
    { title: "Fewer questions", body: "Onboarding only asks what actually changes something later. Nothing collected just in case." },
    { title: "Only what gets used", body: "Today shows four activities, not the whole library. A daily habit needs a short list, not a browse." },
    { title: "Call people by name", body: "The app says “Priya” and “Aanya,” not “you” and “your child.” It reads like a person, not a form." },
    { title: "One thumb, one hand", body: "Every screen has to work while holding a baby. Buttons sit low, and things you'd reach for are easy to find." },
    { title: "Cut what only made sense to us", body: "We built a whole separate “Parent Mode,” switched from the top corner. Felt clever to build. Parents never found it. It's just a tab now.", standout: true },
    { title: "Trust, shown not told", body: "Sources named, ranges instead of deadlines, “ask a doctor” where it matters. Small signals, everywhere." },
  ];
  cardGrid(s, cards6, 0.7, 2.05, 11.9, 4.2, 3);
  pageNum(s, 6, TOTAL);
}

// ===================== SLIDE 7 — What's in it, and what isn't =====================
{
  const s = baseSlide(C.ground);
  heading(s, "What's in it, and what isn't", { fontSize: 32 });
  kicker(s, "Built", { y: 1.85, fontSize: 10 });
  const stats = [
    ["1,149", "activities, birth to seven years"],
    ["137", "things to look out for as they grow"],
    ["54", "vaccinations, government and IAP"],
    ["17", "database tables"],
    ["142", "commits on the website"],
    ["30+", "on the app. Some shipped straight through Vercel."],
    ["33k", "lines of code"],
  ];
  const sx = 0.7, sy = 2.2, sw = 6.4, gap = 0.14;
  const scols = 2, srows = Math.ceil(stats.length / scols);
  const tileW = (sw - gap) / 2, tileH = 1.0;
  stats.forEach((st, i) => {
    const r = Math.floor(i / 2), c = i % 2;
    statTile(s, sx + c * (tileW + gap), sy + r * (tileH + gap), tileW, tileH, st[0], st[1]);
  });

  const rx = 7.5, ry = 1.85;
  s.addText("WHERE IT STANDS", {
    x: rx, y: ry, w: 5, h: 0.3, fontFace: BODY, bold: true, fontSize: 10, color: C.primary, charSpacing: 1, margin: 0,
  });
  const rows7 = [
    { tag: "Working", color: C.positive, text: "Sign-up, the daily four, discoveries, vaccinations, the parent side, the AI, community. Real accounts and a real database." },
    { tag: "Half done", color: C.accent, text: "Reports, the kit guide and the product guide are built and clickable, but the content isn't written yet." },
  ];
  let ry2 = ry + 0.45;
  rows7.forEach((row) => {
    tagChip(s, rx, ry2, row.tag, row.color);
    s.addText(row.text, {
      x: rx, y: ry2 + 0.4, w: 5.1, h: 0.85,
      fontFace: BODY, fontSize: 11, color: C.inkSoft, margin: 0, lineSpacingMultiple: 1.2,
    });
    ry2 += 1.4;
  });
  pageNum(s, 7, TOTAL);
}

// ===================== SLIDES 8-10 — the three interns =====================
function personSlide(n, role, name, facts, punch) {
  const s = baseSlide(C.groundPeople);
  s.addShape("rect", {
    x: 0.7, y: 1.5, w: 2.6, h: 3.25,
    fill: { type: "none" }, line: { color: C.accent, width: 1.5, dashType: "dash" },
  });
  s.addText("PHOTO OF\n" + name.toUpperCase() + "\nGOES HERE", {
    x: 0.7, y: 1.5, w: 2.6, h: 3.25,
    fontFace: MONO, fontSize: 10, color: C.accent, align: "center", valign: "middle",
    lineSpacingMultiple: 1.4, margin: 0,
  });
  s.addText(("INTERN " + role).toUpperCase(), {
    x: 3.7, y: 1.5, w: 6, h: 0.3, fontFace: BODY, bold: true, fontSize: 10.5, color: C.primary, charSpacing: 1, margin: 0,
  });
  s.addText(name, {
    x: 3.7, y: 1.8, w: 6, h: 1.0, fontFace: SERIF, fontSize: 44, color: C.ink, margin: 0,
  });
  const factItems = facts.map((f, i) => ({
    text: f, options: { bullet: { code: "2013" }, breakLine: i < facts.length - 1, paraSpaceAfter: 10 },
  }));
  s.addText(factItems, {
    x: 3.7, y: 2.95, w: 8.2, h: 2.0, fontFace: BODY, fontSize: 14, color: C.inkSoft, margin: 0, lineSpacingMultiple: 1.25,
  });
  s.addText(punch, {
    x: 3.7, y: 5.1, w: 8.2, h: 0.6, fontFace: SERIF, italic: true, fontSize: 15, color: C.primary, margin: 0,
  });
  pageNum(s, n, TOTAL, false);
}

personSlide(8, "one", "Yati", [
  "We call her aggressive. We mean it as a compliment.",
  "All of us are a little scared of her. Also a compliment.",
  "But if a job is hers, it's done, and it's done properly. She never needs chasing.",
], "Best approached with your work already finished.");

personSlide(9, "two", "Muskan", [
  "Brutally honest about everything. You always know exactly where you stand with her.",
  "Head down, gets on with it, never makes noise about any of it.",
  "She gets ill sometimes. Once she sent Rachit her actual medical reports as proof. Nobody had asked for proof.",
], "Most of us text “not well today.” Muskan submits evidence.");

personSlide(10, "three", "Tejas", [
  "National level table tennis player. Do not agree to a friendly game.",
  "Also the founder's nephew. Yes, we've all made the joke already.",
  "And he still works as hard as anyone here, which he didn't have to.",
], "The only person in the office with a national ranking.");

// ===================== SLIDE 11 — Close =====================
{
  const s = baseSlide(C.ground);
  s.addText("That's it.", { x: 0.7, y: 1.0, w: 9, h: 1.1, fontFace: SERIF, fontSize: 44, color: C.ink, margin: 0 });
  s.addText(
    "Everyday moments into meaningful childhood memories, with as little friction as possible.",
    { x: 0.7, y: 2.15, w: 8.5, h: 1.1, fontFace: BODY, fontSize: 19, color: C.ink, margin: 0, lineSpacingMultiple: 1.25 }
  );
  s.addText(
    "A website that's live, and an app you can put on your phone right now. It's just a link. No app store, no invites.",
    { x: 0.7, y: 3.5, w: 9.5, h: 0.8, fontFace: BODY, fontSize: 13, color: C.inkSoft, margin: 0, lineSpacingMultiple: 1.25 }
  );
  s.addText("THANK YOU  ·  QUESTIONS?", {
    x: 0.7, y: 4.6, w: 8, h: 0.4, fontFace: MONO, fontSize: 12, color: C.inkFaint, charSpacing: 1, margin: 0,
  });
  pageNum(s, 11, TOTAL);
}

const OUT = path.join(__dirname, "presentation-deck.pptx");
pres.writeFile({ fileName: OUT }).then(() => console.log("written:", OUT));
