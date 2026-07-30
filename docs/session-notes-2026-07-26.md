# Session notes — 26 July 2026

Covers both repos: `the-neighbourhood` (website) and
`the-neighbourhood-mobile` (Expo app). Written as a record of decisions
and their reasons, so the "why" survives longer than the diff.

> **Caveat.** Several mobile screens have been edited since — a guided
> tour, a restructured Journey tab, milestone notes. This describes what
> was built in this session, not necessarily the current state of those
> files.

---

## 1. Website

### Homepage promoted to root

`/next` became `/`. The old `LandingPageV3` and its exclusive sections
(`HeroV3`, `Truths`, `Belief`, `Pillars`, `LifeInside`, `ClosingInvite`)
were deleted; `/next*` now redirects to the new root paths.

Found along the way: `main` on GitHub had its **own** parallel `/next`
rebuild — nine commits from a separate process. Confirmed with Siddharth,
then force-pushed this branch over it and deleted `homepage-v4`.

### Milestone timeline data — three real bugs

The "Every child on their own clock" section had content defects, not
styling ones:

1. **12–15 months duplicated 10–12 months** verbatim ("Stands alone
   briefly") — the default-shown stage, so the first thing a visitor saw
   showed zero progression.
2. **Communication counts went backwards**: 10–12mo said "1–3 words",
   12–15mo said "1–2 words", then 15–18mo jumped to "5–10 words". A
   child's vocabulary shouldn't shrink.
3. **Cognitive was promised but never shown.** The copy claimed coverage
   "across motor, communication, social and cognitive growth", but the
   generator did `domains.slice(0, 3)` and silently dropped Cognitive from
   all 15 stages.

Fixed at the data layer and the generator, so regenerating can't
reintroduce them.

### Mobile navigation

Nav links were `hidden lg:flex` with **no fallback** — mobile visitors had
no way to reach them at all. Added a hamburger and full-screen overlay.

Fixing it surfaced a genuine CSS bug: `backdrop-filter` on `<nav>` creates
a containing block for `position: fixed` descendants, which collapsed the
overlay to the navbar's own ~72px instead of the viewport. Moved the blur
to an inner wrapper.

### Invitation card restored

The charcoal card at the end of the page — *"one warm room at the end of
the page, a single door in"* — was lost when v4 was promoted and flattened
it onto cream. Recovered from git history and reinstated.

**Then a real alignment bug.** Reported as "text going way too high", and
it was: padding computed as a symmetric 128px, but the text rendered 16px
from the top and 240px from the bottom.

Cause: the decorative blobs sit outside the card's edges, and an
absolutely positioned child extending past its parent **still counts
toward `scrollHeight`**. The card became scrollable (756px in a 644px box)
despite `overflow-hidden`, and focusing the button scrolled it by exactly
the blob's 112px overshoot (`-bottom-28` = 7rem).

It would have hit any keyboard user tabbing to the button. Fix: blobs live
in a wrapper pinned to the card's own box.

> Worth recording: the first diagnosis was wrong. The `blur()` filter in
> the reveal animation was blamed and the component restructured around
> that theory; the numbers came back identical, which is what disproved
> it. `scrollTop: 112` only appeared after continuing to measure.

---

## 2. Mobile app — information architecture

### Three tabs, and only three

`Home` · `Copilot` · `Growth`. Profile sits behind a top-corner avatar as
a modal, deliberately **not** a fourth tab — account chrome shouldn't
occupy a slot that belongs to the child.

Replaced a hand-rolled `BottomNav` that used `router.replace()`, so every
tab switch tore down and rebuilt the screen, losing Copilot's scroll
position and any in-flight message.

Growth is a nested `Stack`: timeline landing, with sections one tap deeper
(two from Home). `lib/growthSections.ts` is the single source of truth for
both the landing list and the Stack registration, so they can't drift.

**A routing conflict worth remembering:** route groups are transparent to
URLs, so `app/(tabs)/index.tsx` would have collided with `app/index.tsx`
(the auth gate). Home is `home.tsx` → `/home`.

### Onboarding

Split into one question per screen: parent name → child name → birthday →
gender. Both names are required — the whole product addresses the family
by name, and a nameless Home would fall back to "your child".

**The date picker had no way to pick a date.** It used
`@react-native-community/datetimepicker`, which has no web implementation
and rendered nothing. Replaced with a three-column selector built from RN
primitives, identical on every platform. Nothing is pre-selected: DOB
drives every activity, milestone and vaccination date, so a plausible
default a parent taps past is worse than an empty field.

---

## 3. Home — four activities a day

One per developmental domain. Never a checklist: exactly one card expands
at a time, completed ones collapse to quiet lines and stay visible.

**Content gap found:** every band held only two activities covering two
domains, and Social & Emotional appeared in **one band out of seven**.
Filling four domains with a spare for the swap needed 8 per band —
authored the missing 42, bringing it to 56. A dev-only check warns if any
band drops below two per domain.

Ordering runs through `orderDomains()` so least-recently-completed ranking
can drop in later without touching the plan array, segments, or rows.

---

## 4. Database

### Four decisions that shaped it

1. **Plans are persisted.** `daily_plans`, unique per `(child_id,
   plan_date)`. `get_or_create_daily_plan` only generates when absent, so
   reopening shows the same four activities.
2. **Dates are family-local.** `profiles.timezone` (IANA, from the
   device). UTC would roll an IST family over at 05:30 — mid-morning.
3. **`activity_log` snapshots its content.** domain/title/age_band are
   columns, not lookups. Editing or retiring a library activity must never
   rewrite a child's history.
4. **Children are their own table.** Multi-child works at the data layer;
   no multi-child UI.

`started_at` was added later so abandonment is observable — a row with
`started_at` set and `completed_at` null is an activity that was started
and never finished. Progress counting filters on `completed_at`, so
starting never advances "N of 4".

### What the live database actually had

Probed directly rather than trusting the migration files: only `waitlist`
existed. The `parents`/`children` migration was untracked and **never
applied** — which also means `making.tsx` had been writing to tables that
didn't exist, swallowed by a `catch`.

Migrations consolidated into this repo, waitlist ones moved byte-for-byte
(Supabase tracks by filename; renaming would re-run them).

### Content

| Table | Rows | Source |
|---|---|---|
| `activities` | 56 | `lib/todaysPlan.ts` |
| `milestones` | 199 | website `journeyStages.json` |
| `vaccination_schedule` | 54 | NIS (UIP) + IAP-ACVIP 2023 PDFs |

Seed is generated by `scripts/gen-seed.mjs` so it can't drift from source,
and emitted as a **migration** rather than `seed.sql` — the latter only
runs on a local `db reset` and never reaches a remote project.

### Vaccination tiers

Three tiers, per the requested framing: **Essential** (UIP, free at
government centres, 21 rows) · **Recommended** (IAP beyond UIP, 26) ·
**Situational** (geography/risk only, 7).

Where the schedules disagree, both entries are kept with a note rather
than silently picking one — PCV and JE are in the UIP but only in named
states, so they read as situational there while PCV is also recommended
because IAP advises it for every child.

Transcribed from the PDFs, never reconstructed. Rows show "Due", never
"overdue" — the app can't know what happened at the clinic.

---

## 5. Auth

Email OTP is **broken at the template level**: Supabase sends a magic
link, but `verify.tsx` expects a six-digit code. Both the *Confirm signup*
and *Magic Link* templates need `{{ .Token }}` — fixing only one leaves
new signups broken, which is exactly the tester's path.

Rather than block on that, `AUTH_MODE` in `lib/authMode.ts` is
`"anonymous"`: onboarding silently creates a real Supabase user, so RLS
works and every row is real, while the parent never sees an account step.
Trade-off: device-bound until linked to an email. Switching back is one
constant — `contact.tsx`, `verify.tsx` and `sign-in.tsx` were never
deleted.

---

## 6. Verified end to end

Against the real database, with a fresh anonymous account:

- fresh signup → `profiles` row
- onboarding → `children` row, correct age
- Home → plan generated, correct age band
- Start → logged, **"0 of 4" correctly did not move**
- Complete → "1 of 4"
- Milestone marked → `child_milestones`
- Vaccination recorded → `child_vaccinations`

Caught during that run: `making.tsx` would attempt `createChild` with an
empty date if reached with a partial draft (restored route, deep link),
surfacing a raw Postgres error. Now redirects to the missing step.

---

## 7. Open items

- **`vaccination_schedule` needs review by someone clinical.** It's
  transcribed accurately, but it's medical content in a parenting app.
- **No milestones for ages 5–7.** The source library stops at six years,
  so that band is empty. Handled with a calm empty state.
- **Two activities per domain per band** is the bare minimum — one swap
  exhausts the pool. Real variety needs four or more.
- **Docker never came up**, so migrations were applied to production
  without a local dry-run. Future schema changes have no rehearsal
  environment.
- **Test data in production:** several anonymous profiles/children from
  verification runs.
- **App icon and splash** are pre-brand-mark PNGs — the most-seen brand
  surfaces are still the old artwork.
- **Copilot is a scaffold.** It accepts a question and replies that it
  isn't connected.
