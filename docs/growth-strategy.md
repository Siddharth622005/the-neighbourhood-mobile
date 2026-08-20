# The Neighbourhood — Launch, Acquisition & Monetization Strategy

**Status:** Working plan, next 3–6 months
**Date:** 8 August 2026
**Basis:** Audit of the live codebase (mobile app + website + Supabase), not assumptions.

---

## 0. What this document assumes, and what it doesn't

Everything in Parts 1–3 is grounded in what is actually built and measurable today. Everything downstream (conversion rates, pricing, channel yields) is a **hypothesis with an experiment attached**, because we currently have **zero product analytics installed** and **11 waitlist signups**. Any number presented as a "target" is a target, not a forecast.

Where I've had to choose, I've chosen. Alternatives are noted only where the experiment genuinely branches.

---

## 1. Executive Summary

### The honest position

We have a **surprisingly deep product** and **effectively no distribution, no instrumentation, and no evidence of retention.**

What's genuinely built and working:
- **1,149 activities** across **28 three-month age bands** (0–7 years), 4 developmental domains, served from Postgres with deterministic daily selection, swap, offline-tolerant completion logging
- **137 milestones** with achievement tracking, **a real IAP/UIP vaccination schedule**
- **A working AI Copilot** (Groq / Llama 3.3 70B) with per-child context, RLS-scoped, safety-railed — in both Child and Parent modes
- **Parent Care**: 7 care areas, 33 long-form topics, mother/father differentiation, postpartum profile
- **Kid Meal Planner**: 6 feeding stages, stage-specific nutrients, ~19 recipes, Indian-context foods
- **Courses & Workshops** scaffolding with 5 seeded courses / 18 lessons / 4 workshops
- Live PWA at `the-neighbourhood-mobile.vercel.app`, live marketing site, Supabase backend in production

What's not real (and is currently misrepresented in-product):
- **Community is mock data.** In-memory fixtures — fabricated parents, fabricated expert replies — shipped to production and reset on reload.
- **Copilot conversations are not persisted.** Tables exist; UI never writes to them. Every reload wipes the thread.
- **Reports, Development Kit, Product Guide** are honest scaffolds (good — they say so).
- **Course video URLs are `example.com` placeholders.** No real course content exists.
- **Zero analytics.** We cannot currently answer "did anyone come back tomorrow?"
- **No payments, no push notifications, no email/WhatsApp infrastructure.**

**Waitlist: 11 signups, most recent ~4 weeks ago.** The waitlist is not a pipeline. It's a form on a page nobody visits.

### The strategic call

**Do not build more features. Do not run paid ads. Do not scale the waitlist.**

The single question that decides whether this business exists is: **will an Indian urban parent open this app on day 7?** We have no idea, because we have never had enough users or any instrumentation to find out.

So the next 90 days are: **instrument → fix integrity → hand-recruit 100 real parents → prove D7 → sell one workshop → then, and only then, launch a subscription.**

### The three bets

1. **Segment bet:** Urban Indian mothers of children **6–24 months**. Narrow deliberately.
2. **Wedge bet:** The daily "what do I do with my child today" loop is the habit; **milestones + vaccinations** are the anxiety-relief that makes it sticky; **Parent Care** is the differentiator nobody else in this market has.
3. **Distribution bet:** **The WhatsApp family group is the growth channel** — grandparents, not strangers. Not Instagram-first. Instagram supports; WhatsApp compounds.

### Revenue path

**Workshops first (₹499, week 4–6), subscription second (₹1,499/yr, day 60–90, gated on D30 ≥ 25%).** Workshops prove willingness-to-pay in three weeks with a Razorpay link and zero code. Subscriptions require retention proof we don't have yet.

---

## 2. Target User

### 2.1 Primary user — be narrow

**Urban Indian mother, first-time or second-time, child aged 6–24 months, English-comfortable, smartphone-primary, metro or tier-1 city.**

The India orientation isn't a choice I'm imposing — it's already baked into the product: the vaccination schedule is IAP/UIP, and the activity and meal content is full of *atta*, *khichdi*, *paneer*, *rajma*, *dal-chawal*, *tel maalish*, Hinglish prompts ("Kahaan gayi?", "Yeh naak hai"), and a Bandra West workshop venue. **We are already an India-first product. Own it.**

### 2.2 Why 6–24 months specifically

| Stage | Why not / why yes |
|---|---|
| 0–6 months | **No.** Survival mode. Meal Planner is deliberately empty. Milestones sparse. Parents are sleep-deprived and not app-curious. Low willingness to add a new habit. |
| **6–24 months** | **Yes.** Solids begin (Meal Planner's strongest moment). Milestone density and *milestone anxiety* peak. Vaccinations are frequent. "What do I do with them today?" becomes a genuine daily question. Activity library is richest here. |
| 2–7 years | Later. Preschool absorbs the "what do we do today" job. Our content thins relative to competition. Different sale entirely. |

**6–24 months is where anxiety, daily-need, and our content depth intersect.** That intersection is where habits and payment both live.

### 2.3 Secondary users (do not target yet, but design for)

- **Fathers** — the app already has father-differentiated Parent Care. This is a *referral surface*, not an acquisition segment, in the first 90 days.
- **Grandparents** — not users. **The distribution channel.** See §9.

### 2.4 The problem we actually solve

Two loops running simultaneously in a new parent's head:

1. **"What do I do with them today?"** — guilt about unstructured time, no idea what's age-appropriate, decision fatigue at the exact moment they have least capacity.
2. **"Are they okay?"** — is this normal, are they behind, should I be worried, and the internet's answer is either terrifying or contradictory.

Everything else — meals, sleep, vaccinations — hangs off these two.

### 2.5 Why not the alternatives

| Alternative | Why we win |
|---|---|
| **Google** | Answers a query. Doesn't know your child, doesn't remember, and returns a wall of contradictory results. We give *one* answer for *your* child today. |
| **ChatGPT** | Genuinely good at answers — but has no persistent child context, no daily prompt, no tracking, no accountability. It waits for you to ask. **We tell you before you ask.** |
| **Instagram** | Optimised for comparison and anxiety. Every scroll is another baby doing something yours isn't. We are explicitly non-comparative (the codebase enforces "describe, never grade"). |
| **Parenting blogs** | Generic, SEO-shaped, ad-laden, Western-defaulted. Ours is age-exact and India-native. |
| **Point apps** (tracker / meal / milestone apps) | Each solves one slice. Parents don't want five apps. We're the one place — *and* we're the only one that also cares about **the mother**. |

**The unfair advantage is Parent Care.** Every competitor treats the child as the customer and the mother as the operator. We're the only product in this market with a serious, well-written postpartum recovery and mental-health layer — including father-differentiated content. That's the emotional moat, and it's already built.

---

## 3. Positioning

### One-line positioning

> **The Neighbourhood is the daily companion for your child's first seven years — four things to do today, chosen for their exact age, and a quiet record of how they're growing.**

### Elevator pitch

> New parents are stuck between boredom and panic. They don't know what to do with their child today, and they don't know if their child is on track. Google contradicts itself, Instagram makes it worse, and ChatGPT doesn't know their kid.
>
> The Neighbourhood gives every parent four things to do today — chosen for their child's exact age, down to the three-month band — plus milestone and vaccination tracking, an AI companion that actually knows their child, and something no other app has: real care for the parent themselves.
>
> Built for Indian families, with Indian food, the Indian immunisation schedule, and the language parents actually use at home.

### Core promise

> **You'll always know what to do today, and you'll never wonder alone whether they're okay.**

### Product pillars

| Pillar | In-product | Job |
|---|---|---|
| **1. TODAY** | Home — 4 daily activities | The habit. The reason to open the app. |
| **2. TRACK** | Milestones, Vaccinations | The anxiety relief. The reason to stay. |
| **3. ASK** | AI Copilot | The safety net. The reason to trust. |
| **4. YOU** | Parent Care, Parent Mode | The differentiator. The reason to love it. |

*(A fifth — LEARN, i.e. Courses & Workshops — is a **revenue** pillar, not a launch pillar. See §11.)*

### What we must NOT position as

- ❌ **A social network / parenting forum.** Community is currently mock. Fixing it properly is a full moderation and cold-start problem. Not now.
- ❌ **A medical or diagnostic product.** The codebase is disciplined about this; marketing must be too.
- ❌ **A milestone scorecard.** No percentiles, no ranking, no "your child is behind." This is a hard brand rule.
- ❌ **A content library.** Content is the delivery mechanism, not the product. The product is the daily decision.
- ❌ **An everything-app for all parents 0–7.** True eventually. Fatal as a launch message.

---

## 4. Launch Strategy

### 4.1 Feature triage

Scored on `User value × Acquisition × Retention × Monetization ÷ Effort`.

#### ✅ MUST HAVE FOR LAUNCH

| Feature | State | Work needed |
|---|---|---|
| Onboarding | Built (4 steps) | Add "biggest challenge" question for segmentation |
| Today's plan (4 activities) | **Built, strong** | None — this is the product |
| Milestones | Built | None |
| Vaccinations | Built | Add due-date reminders |
| AI Copilot | Built (Groq) | **Persist conversations** — tables exist, UI doesn't write |
| Meal Planner | Built | None |
| **Analytics (PostHog)** | ❌ **Missing** | **Install day 1. Nothing else matters without it.** |
| **Nudges (WhatsApp/push)** | ❌ Missing | Minimum viable: daily WhatsApp nudge, manual at first |

#### 🟡 IMPORTANT, CAN FOLLOW (day 30–90)

| Feature | Rationale |
|---|---|
| **Parent Care** | Already built and excellent — but it's a *retention & love* feature, not an acquisition hook. Surface it at day 3, not day 0. |
| Reports | Scaffold. Real once there's activity history. Strong premium candidate. |
| Courses | Scaffold + placeholder videos. Only after workshops validate demand. |
| Co-parent / family invite | The referral engine. Build at day 30. |

#### 🛑 DO NOT BUILD YET

| Feature | Why |
|---|---|
| **Community** | Cold-start + moderation + trust. Currently **shipping fabricated discussions** — fix by hiding, not by building. |
| Development Kit | Physical product implications. Different business. |
| Product Guide | Needs a commercial-disclosure position first (the code says so, correctly). |
| In-app payments/IAP | Use a Razorpay link. Don't build billing before you have a payer. |
| Expert marketplace | Two-sided marketplace. Not in 90 days. |

### 4.2 Launch phases

#### Phase 0 — Foundation *(Days 1–14)*
- **Objective:** Become measurable and trustworthy.
- **Users:** None (internal).
- **Product state:** PostHog installed + funnel instrumented; Community hidden; Copilot persistence shipped; onboarding adds "biggest challenge."
- **Learn:** Nothing yet — we're building the instrument.
- **Success:** Full funnel visible in a dashboard. Zero fabricated content in production.
- **Gate to Phase 1:** Activation event fires correctly for a test cohort of 5 internal users.

#### Phase 1 — Closed beta *(Days 15–45)*
- **Objective:** Prove D7 retention on a hand-picked segment.
- **Users:** **50–100 hand-recruited mothers, children 6–24 months.** Recruited personally — WhatsApp, apartment groups, a friendly pediatrician, mom communities. **Not from the waitlist** (11 people, unsegmented).
- **Product state:** Launch feature set above.
- **Acquisition:** 100% manual. Founder in the DMs. This is not a scale phase.
- **Learn:** Do they come back on day 2? Day 7? Which of the 4 pillars do they actually touch? Where do they drop in onboarding?
- **Success:** Activation ≥ 40%, **D7 ≥ 30%**, ≥ 15 parents in a WhatsApp feedback group.
- **Gate:** **D7 ≥ 30%.** If D7 < 20%, do not proceed — fix the product.

#### Phase 2 — Early access *(Days 46–75)*
- **Objective:** Prove one repeatable acquisition channel + first rupee.
- **Users:** 300–500.
- **Product state:** + referral share card, + Parent Care surfaced, + nudges automated.
- **Acquisition:** Referral loop live; 2 pediatric clinic partnerships; Instagram Reels at 3/week.
- **Learn:** Which channel has the lowest cost and highest D7? Will anyone pay ₹499 for a live workshop?
- **Success:** ≥ 1 channel with CAC < ₹150 and D7 ≥ 30%; **first paid workshop sells ≥ 20 seats**; referral coefficient ≥ 0.15.
- **Gate:** One channel repeatable + ≥ 20 paid workshop seats.

#### Phase 3 — Public launch *(Days 76–120)*
- **Objective:** Launch subscription; scale the winning channel.
- **Users:** 1,500–3,000.
- **Product state:** + Premium tier, + Reports, + trial flow.
- **Acquisition:** Scale winner; add ProductHunt/press moment; expand clinic partnerships to 10.
- **Learn:** Free→paid conversion. LTV:CAC.
- **Success:** **≥ 3% free→paid**, D30 ≥ 25%, MRR ≥ ₹75,000.
- **Gate:** LTV:CAC > 3 before any paid spend.

#### Phase 4 — Growth *(Day 120+)*
- Paid acquisition (only now), courses, deeper partnerships, 2–7 year expansion, possibly Community done properly.

---

## 5. Waitlist Strategy

### 5.1 Reframe: the waitlist is currently a liability, not an asset

11 signups in a month means **the website gets no traffic**, or **converts nobody**, or both. Growing the waitlist is not the fix — **the product is live**. There is no scarcity to gate.

**Recommendation: retire the "waitlist" framing entirely at the end of Phase 1.** Replace the site CTA with **"Open the app"** → straight into the PWA. A waitlist for a product that's already deployed is friction pretending to be exclusivity.

Until then (Phase 0–1), keep it as a **beta application form**, not a queue.

### 5.2 What the website must communicate

Currently the site sells a *brand*. It needs to sell a *job*.

- **Above the fold:** the promise — *"Four things to do with your child today. Chosen for their exact age."*
- **Proof:** an actual screenshot of Today's plan for a real age band. Show the product.
- **CTA:** **"See today's activities"** → age picker → *live sample plan* → then ask for the signup.

**Give value before asking for the email.** Let them pick "9 months" and immediately see three real activities from the library. We have 1,149 of them; showing four costs nothing and converts far better than a form.

### 5.3 Minimum data to collect

Collect only what changes what we do next:

| Field | Why | Required |
|---|---|---|
| **Child's date of birth** (not "stage") | Determines the entire product. Exact DOB, since we band by 3 months. | ✅ |
| **Parent role** (mother/father/other) | Routes Parent Care content. | ✅ |
| **WhatsApp number** | The activation channel in India. Higher-intent than email. | ✅ |
| **Biggest challenge right now** (one tap: sleep / food / development / my own health) | Segments onboarding *and* content. Highest-value field. | ✅ |
| Name | Personalisation. | ✅ |
| Email | Secondary. | Optional |
| Number of children | Nice, not decision-changing yet. | ❌ |
| Acquisition source | Use UTMs, don't ask. | ❌ |

⚠️ **Bug to fix:** the site collects `child_stage` and `child_name`, but the insert has a fallback that **silently strips them** if the columns don't exist, and the DB grant only exposes `id, created_at, referred_by`. **Our one segmentation field may be going in the bin.** Verify and fix before any acquisition push.

### 5.4 Pre-launch engagement (Phase 0–1 only)

With 11 people, this is a **phone call, not a campaign**. Literally message all 11 personally. That's an afternoon and it's worth more than any drip sequence.

For the beta cohort, one WhatsApp broadcast per week, and it must be *useful on its own*:
- Week 1: "3 things to try with a 9-month-old this week" (pulled from the real library)
- Week 2: "The vaccines due in the next 60 days" (real IAP data)
- Week 3: "Your invite is live" + 1:1 onboarding offer

**Never send a "we're still building!" email.** It's a withdrawal from a very small trust account.

### 5.5 Beta mechanics

- **Cohort size:** 50 to start, 100 by day 45. Small enough to talk to every single one.
- **Selection:** child aged 6–24 months → everyone else waits. Ruthless.
- **Invitation:** personal WhatsApp message with a direct link. Not an email blast.
- **Measure:** activation, D2/D7, feature touch, and — most important — **10 recorded 20-minute interviews.**
- **Expand:** only after D7 ≥ 30% holds for two consecutive weekly cohorts.

---

## 6. User Acquisition Strategy

### 6.1 Channel evaluation

| Channel | Fit | Cost | Difficulty | Time to result | Scalability | Trust | Verdict |
|---|---|---|---|---|---|---|---|
| **WhatsApp family/apartment groups** | ⭐⭐⭐⭐⭐ | Free | Low | Days | Medium-High | ⭐⭐⭐⭐⭐ | **START NOW** |
| **Pediatricians / vaccination clinics** | ⭐⭐⭐⭐⭐ | Low | Medium | 2–4 wks | Medium | ⭐⭐⭐⭐⭐ | **START NOW** |
| **Instagram Reels (founder-led)** | ⭐⭐⭐⭐ | Time | Medium | 4–8 wks | High | ⭐⭐⭐ | **START NOW** |
| **Mom communities (FB / WhatsApp)** | ⭐⭐⭐⭐⭐ | Free | Low | Days | Low-Med | ⭐⭐⭐⭐ | **START NOW** |
| **Referral loop (in-product)** | ⭐⭐⭐⭐⭐ | Free | Medium | 4–6 wks | High | ⭐⭐⭐⭐⭐ | **START NOW** (build d30) |
| Preschools / daycares / play centres | ⭐⭐⭐⭐ | Low | Medium | 4–8 wks | Medium | ⭐⭐⭐⭐ | TEST LATER (d45+) |
| Micro-influencers (5–50k mom accounts) | ⭐⭐⭐⭐ | ₹3–15k | Medium | 2–4 wks | Medium | ⭐⭐⭐ | TEST LATER (d60) |
| SEO | ⭐⭐⭐ | Time | High | 4–6 **months** | Very High | ⭐⭐⭐ | TEST LATER (start writing d60) |
| YouTube long-form | ⭐⭐⭐ | High time | High | 3–6 months | High | ⭐⭐⭐⭐ | LATER |
| Workshops as acquisition | ⭐⭐⭐⭐ | Low | Medium | 3–4 wks | Medium | ⭐⭐⭐⭐⭐ | **START (d30)** — doubles as revenue |
| Paid ads (Meta) | ⭐⭐⭐ | ₹₹₹ | Low | Days | High | ⭐⭐ | **DO NOT** until LTV:CAC > 3 |
| Brand partnerships (diaper/formula) | ⭐⭐ | — | High | Months | Medium | ⭐⭐ | DO NOT PRIORITISE |
| App store optimisation | ⭐⭐ | Low | Low | — | Medium | ⭐⭐⭐ | **N/A — we're a PWA, not in stores** |

### 6.2 Concrete experiments

---

**EXPERIMENT 1 — "What do I do with my child today?" Reels**
- **Do:** 10 Reels, 20–30s each, each demonstrating **one real activity from the library**, titled by exact age. *"9-month-olds love this: the mystery bag."* Founder or a real parent + real baby. Shot on a phone.
- **Hypothesis:** Mothers of 6–24mo will save/share age-specific, immediately-doable activities, because the content *is* the product — there's no gap between ad and value.
- **CTA:** "Get today's four, free → link in bio"
- **Metric:** ≥ 5% save rate; ≥ 100 link clicks across 10 videos; ≥ 25 signups.
- **Kill:** < 10 signups from 10 videos → the hook is wrong, not the channel.

---

**EXPERIMENT 2 — Pediatric clinic waiting-room card**
- **Do:** 3 clinics in one city. A tasteful A5 card at reception: *"The vaccines your child needs, tracked free. Plus something to do together today."* QR → app with the IAP schedule pre-loaded.
- **Hypothesis:** Vaccination day is the highest-anxiety, highest-intent moment in a parent's month, and our IAP schedule is genuinely useful and genuinely free. Doctor proximity transfers trust no ad can buy.
- **CTA:** QR → vaccination screen (not homepage).
- **Metric:** ≥ 30 scans/clinic/month; ≥ 40% activation from this source (should be our *highest*-quality source).
- **Kill:** < 10 scans/clinic/month after 6 weeks.

---

**EXPERIMENT 3 — The grandparent share card** *(the big one — see §9)*
- **Do:** After a milestone is marked, offer a beautiful shareable card: *"Maya, 14 months — took her first steps today."* One tap to WhatsApp.
- **Hypothesis:** Indian parents already send these updates to family WhatsApp groups **manually**. We're not creating a behaviour, we're *decorating an existing one* — and putting a footer on it.
- **CTA:** Card footer: "Tracked with The Neighbourhood"
- **Metric:** ≥ 25% of milestone-markers share; ≥ 0.15 new signups per sharer.
- **Kill:** < 10% share rate → the card isn't beautiful enough or the moment is wrong.

---

**EXPERIMENT 4 — Mom-community value drop**
- **Do:** Join 10 active Indian mom groups. For 3 weeks, **only answer questions** — no promotion. Week 4, share a free resource: *"I made an age-by-age activity list, 6–24 months, free, no signup."* Gate nothing.
- **Hypothesis:** Trust-first entry converts far better than link-drops, which get removed.
- **CTA:** Soft link after value.
- **Metric:** ≥ 50 clicks, ≥ 20 signups, zero bans.

---

**EXPERIMENT 5 — Paid live workshop** *(revenue + acquisition, see §11)*
- **Do:** One 60-min live workshop, ₹499, real pediatric sleep consultant, 25 seats, Zoom + Razorpay link. Promote to beta cohort + Instagram.
- **Hypothesis:** Indian parents pay readily for **live expert access** even when they won't pay for an app subscription — education and health are culturally payable categories.
- **CTA:** "Book your seat — ₹499"
- **Metric:** ≥ 20 seats sold. **This is our willingness-to-pay proof.**
- **Kill:** < 8 seats at ₹499 → test ₹199 before concluding no demand.

---

### 6.3 Ranking

**START NOW:** WhatsApp/community organic · Pediatric clinics · Instagram Reels · In-product referral · Workshops (d30)
**TEST LATER:** Preschools · Micro-influencers · SEO · Courses
**DO NOT PRIORITISE YET:** Paid ads · YouTube · Brand partnerships · Marketplace · App stores

---

## 7. Content Strategy

### 7.1 Pillars — each maps to a product surface

| # | Pillar | Product surface | Job | Format |
|---|---|---|---|---|
| 1 | **What to do today** | Today's plan | Acquisition | Reels, 20–30s |
| 2 | **Is this normal?** | Milestones | Acquisition + trust | Carousels, Reels |
| 3 | **Indian food for babies** | Meal Planner | Acquisition (high share) | Reels, carousels |
| 4 | **Vaccines, explained** | Vaccinations | Authority | Carousels |
| 5 | **For the mother** | Parent Care | Differentiation, deep share | Text posts, Reels |
| 6 | **Behind the build** | — | Trust, early-adopter pull | Stories, LinkedIn |

### 7.2 Content → funnel mapping

- **Attracts:** Pillars 1 & 3 (immediately useful, highly saveable)
- **Converts to signup:** Pillar 2 ("is this normal" → *"see your child's exact stage"*)
- **Demonstrates product:** Pillar 1 (the content *is* the feature — screen-record the real app)
- **Drives sharing:** Pillar 5 ("for the mother" is what women send each other) + Pillar 3
- **Drives monetization:** Pillar 4 & 5 → workshops

### 7.3 Weekly system for a small team

**Sunday, 3 hours — batch everything:**
- Shoot 3 activity Reels (Pillar 1) using next week's real activities
- Design 1 carousel (Pillar 2 or 4) from milestone/vaccination data already in the DB
- Draft 1 WhatsApp broadcast

**Publish:** Mon / Wed / Fri Reels · Tue carousel · Thu WhatsApp broadcast · Sat story/poll

**Total: ~5 hrs/week.** Sustainable by one person. **The content pipeline is the product database** — activities, milestones, vaccinations, and care topics are all already written. We are not creating content; we are *filming content we already own*. That's the unlock.

---

## 8. Activation & Retention

### 8.1 The activation event

I do **not** think it's "completes onboarding + receives first activity." That's passive — a parent can see a plan and feel nothing.

> ### Activation = onboarding complete **+ ≥1 activity marked Done** within 24 hours.

Tapping **Done** is the moment the app stops being something you *read* and becomes something you *did with your child*. It's the first deposit into the relationship, it's the event that makes Reports possible later, and it's the only signal that correlates with a real-world behaviour change.

**Target: 40% of signups activate within 24h.**

**North-star retention metric: D7 with ≥3 active days.**

### 8.2 The journey

**Day 0 — first session (target: < 3 min to value)**
- 4-step onboarding (already fast — protect this)
- **Add one question: "What's hardest right now?"** (sleep / food / development / me) — routes their first Copilot suggestion and first content
- Land on Today's plan, already populated — *no empty state, ever*
- **Aha moment:** *"These are for a 9-month-old. Specifically. Not for 'babies'."*
- Prompt: complete one activity now → **Done** → 🎉 (quiet, non-gamified — brand rule)

**Day 1 — the return**
- Morning WhatsApp: *"Today for Maya: Peek-a-boo, three ways. 10 min, needs a scarf."*
- The nudge contains the **actual activity**, not "come back to the app." Value in the message.

**Day 3 — depth**
- Introduce **Parent Care**: *"How are you doing? Not them — you."* This is where love happens.
- First milestone prompt: *"Has Maya started pulling to stand? Most babies do around now."*

**Day 7 — the hook**
- **First share moment:** *"Maya's done 5 activities this week. Here's a card for the family group."* → referral loop
- Vaccination reminder if due
- Copilot prompt tuned to their day-0 "hardest thing"

**Day 30 — the lock-in**
- **First Report** (build for this): *"A quiet look at the last month"* — what they did, what shifted. Not a scorecard.
- Milestone recap
- **This is the premium trigger point.**

### 8.3 Retention mechanics, ranked by expected impact

1. **Daily nudge with the activity inside it** — highest impact, lowest effort. Start manual via WhatsApp, automate later.
2. **Vaccination reminders** — genuinely load-bearing. Parents *cannot* miss these. Real utility.
3. **Milestone prompts** — periodic, gentle, never comparative.
4. **Copilot with persistent memory** — must fix persistence; a companion that forgets is not a companion.
5. **Parent Care** — the surprise-and-delight that converts a user into an advocate.
6. **Reports** — the compounding artefact. The longer you stay, the more you'd lose by leaving.

### 8.4 Personalisation roadmap

Already strong (28 age bands is unusually granular). Add, in order:
1. Use the day-0 "hardest thing" to weight domain selection
2. Use `domain_recency` (**already built in the DB, unused**) to surface neglected domains
3. Use completion history to learn preferred activity duration/materials
4. Feed activity history into Copilot's context

---

## 9. Referral Strategy

### 9.1 The natural loop is grandparents, not friends

Do not build "invite 3 friends, get a free month." It's transactional and it doesn't match how parents behave.

**What Indian parents already do, every single week:** send photos and updates about their child to a WhatsApp family group. Grandparents, aunts, cousins. This behaviour exists at enormous volume and requires zero education.

**We don't create the behaviour. We make it beautiful and put our name in the corner.**

### 9.2 The loop

```
TRIGGER    Parent marks a milestone ("first two-word sentence")
           — an emotionally peak moment, already happening in-product
     ↓
SHARE      One tap: a beautiful card — child's name, age, the milestone,
           warm brand styling. Straight to WhatsApp.
           Footer: "Tracked with The Neighbourhood"
     ↓
NEW USER   Grandparent/relative sees it in the family group.
           Taps through to a page about THAT child's stage —
           not a generic homepage.
     ↓
VALUE      Two doors:
           (a) "Follow Maya's journey" → family view, low friction
           (b) "Start for your own child" → full signup
     ↓
REPEAT     Every milestone. ~2–4× per month at 6–24 months.
```

### 9.3 Secondary loop — the co-parent

The app **already has father-differentiated Parent Care**. Use it:

> *"Invite Maya's father — he gets his own view, and content written for him."*

This is unusually strong because almost nothing in this market speaks to fathers seriously. It also doubles daily-active users per household and increases retention for both.

### 9.4 What to measure

- **Share rate:** % of milestone-markers who share → target **25%**
- **Referral coefficient:** new signups per sharer → target **0.15** by day 60
- **Co-parent invite rate:** target **20%** of activated users

### 9.5 What NOT to do

❌ Leaderboards ❌ Streaks with loss-framing ❌ "Invite to unlock" ❌ Anything that makes a tired parent feel they're failing a game. This violates the product's own stated tone rules and would damage the brand's core asset: it's the app that doesn't make you feel bad.

---

## 10. Monetization Strategy

### 10.1 First principles: what do parents pay for when information is free?

Information is free. **These are not:**

1. **Certainty** — "is my child okay?" answered *for my child*, not in general
2. **Time** — the decision already made, so I don't have to research
3. **Access to a human expert** — culturally the most payable category in India
4. **A record** — an artefact of my child's growth that I'd lose if I left
5. **Being cared for myself** — nobody else is offering the mother anything

Note that **#3 and #5 are where Indian wallets actually open.** Education, health, and expert access are established payable categories. "An app subscription for parenting content" is not, yet.

### 10.2 Free vs Premium

**FREE — must stay free (acquisition + trust):**
- Today's plan (all 4 daily activities)
- Milestone tracking
- **Vaccination tracking** (never paywall a health-safety feature — that's both wrong and bad marketing)
- Basic Copilot (capped, e.g. 5 questions/week)
- Parent Care articles

**PREMIUM — "The Neighbourhood Plus":**
| Feature | Why parents pay |
|---|---|
| **Unlimited Copilot + memory** | The "certainty" purchase — highest perceived value |
| **Monthly/weekly Reports** | The artefact. Compounds. Loss-averse. |
| **Full activity library + swaps** | Free gets today's four; Plus browses all 1,149 |
| **Co-parent & family accounts** | Household value, drives virality |
| **Advanced meal planning** | Weekly plans, grocery lists |
| **Workshop discounts** (or 1 free/quarter) | Ties the two revenue lines together |
| Deeper Parent Care | Personalised recovery tracks |

### 10.3 Model evaluation

| Model | Verdict |
|---|---|
| **Freemium subscription** | ✅ **Primary** — right long-term shape; needs retention proof first |
| **Paid live workshops** | ✅ **First revenue** — validates willingness-to-pay in 3 weeks, no code |
| Free trial (14-day) | ✅ Yes, at day 30 activation moment, not signup |
| Annual subscription | ✅ Yes — lead with it; Indian users prefer one payment over recurring |
| One-time purchases | ⚠️ Later — "first year kit," report pack |
| Courses sold separately | ⚠️ Only if workshops validate |
| Expert marketplace | ❌ Two-sided, not in 90 days |
| Ads / brand sponsorship | ❌ Destroys the trust that is our entire moat |

### 10.4 Recommendation

> ### Primary model: **Freemium annual-first subscription**, preceded by **paid live workshops** as the willingness-to-pay probe.

**Sequencing — this is the important part:**

- **Day 30–45:** Sell one workshop at ₹499. Razorpay link, Zoom, zero code. *Does anyone pay us anything?*
- **Day 60:** Fake-door test — add a "Plus" screen with pricing and a waitlist button. Measure tap-through. *Do they want it before we build it?*
- **Day 75–90:** Launch subscription **only if D30 ≥ 25%**.

**Why this order:** subscriptions monetise retention. We have no retention data. Workshops monetise *intent*, which we can generate immediately. Selling a workshop in week 4 teaches us more about willingness-to-pay than three months of building a billing system.

**Test later:** (1) One-time "First Year" pack for the price-resistant, (2) B2B2C — clinics/preschools sponsoring parent access, (3) Course bundles.

---

## 11. Courses & Workshops

### 11.1 The call

> **Workshops first. Courses much later. Do not build a course platform.**

The scaffolding exists (5 courses, 18 lessons, 4 workshops, progress tracking) — but **all course videos are `example.com` placeholders.** Real course production is expensive, slow, and unvalidated. Live workshops need Zoom and a payment link.

### 11.2 Workshops — start here

| Dimension | Decision |
|---|---|
| Format | **Live, 60 min, Zoom, cohort-based** |
| Delivery | **External experts** — pediatric sleep consultant, dietitian, child psychologist. Pay ₹5–15k/session or revenue-share. Do not create in-house. |
| Pricing | **₹499** (test ₹199 / ₹499 / ₹999) |
| Cadence | 1 per month → 2 per month if they sell |
| In subscription? | **No initially.** Separate SKU proves independent willingness-to-pay. Later: Plus members get 1 free/quarter. |
| Acquisition role | ✅ **Strong** — an expert's audience becomes ours; recording becomes lead magnet |
| Infrastructure | **Zoom + Razorpay link + a Google Form.** That's it. No platform build. |

**First three topics** (map to the highest-anxiety, best-content areas):
1. *Surviving the sleep regression* — highest search volume, highest pain
2. *Starting solids, without the panic* — pairs with Meal Planner
3. *Is my child on track?* — pairs with Milestones, lowest-anxiety framing

### 11.3 Courses — deferred

Build only when: **≥3 workshops sell out** AND **≥40% of attendees ask for more depth.**

Then: self-paced, video-based, 4–6 lessons, produced from **workshop recordings** (already paid for, already validated) — not filmed from scratch.

**Infrastructure needed then, not now:** real video hosting, DRM/access control, completion certificates.

### 11.4 The business case

Workshops at ₹499 × 25 seats = **₹12,500/session**, minus ₹7,500 expert fee = **₹5,000 margin**. That is not a business by itself — **its value is signal, not profit.** It tells us whether parents open their wallets for us at all, three months before a subscription would.

---

## 12. Pricing

### 12.1 Recommendation

| Tier | Price | Notes |
|---|---|---|
| **Free** | ₹0 | Today's plan, milestones, vaccinations, 5 Copilot Q/wk, Parent Care articles |
| **Plus — Monthly** | **₹249/mo** | Anchor. Expect minority uptake. |
| **Plus — Annual** | **₹1,499/yr** (≈₹125/mo, 50% off) | **Lead with this.** |
| **Trial** | **14 days free**, triggered at **day 30**, not at signup | Trial at signup wastes it before value is felt |
| **Workshop** | **₹499** | Separate SKU |

### 12.2 Assumptions behind these numbers

- ₹249/mo sits in the established Indian consumer-app band (roughly ₹99–499) — above utility apps, below edtech.
- ₹1,499/yr is a **single considered purchase**, which suits Indian payment behaviour better than recurring debits, and it front-loads cash while we're small.
- The 50% annual discount is aggressive **on purpose**: at this stage, annual commitment is worth more than ARPU because it buys us 12 months to prove value and eliminates monthly churn noise from our data.
- Trial at day 30 because our activation-to-value arc is ~7 days; a signup-day trial expires before the product has proven itself.

**These are assumptions, not conclusions.** Which is why:

### 12.3 Pricing experiment plan

| # | Experiment | Method | Decides |
|---|---|---|---|
| 1 | **Workshop price ladder** | 3 workshops at ₹199 / ₹499 / ₹999; compare conversion × revenue | Real price sensitivity |
| 2 | **Fake-door Plus** | In-app pricing screen; button → "Notify me." Show ₹199 vs ₹299 to alternating users | Demand + elasticity, before building billing |
| 3 | **Van Westendorp (n=30)** | Ask beta cohort 4 standard price-perception questions | Acceptable range |
| 4 | **Annual discount depth** | 40% vs 50% vs 60% off | Optimal annual pull |
| 5 | **Paywall placement** | Copilot limit vs Reports vs library access | Which feature actually sells |

Run #1 and #2 **before** writing a single line of billing code.

---

## 13. Metrics & Funnel

### 13.1 The funnel

| # | Stage | Metric | Why | Initial target | If weak |
|---|---|---|---|---|---|
| 1 | Traffic | Unique visitors | Top of funnel | 500/mo by d30 | Content cadence ↑, clinic partnerships |
| 2 | Website → signup | Signup conversion % | Message-market fit | **8%** | Show the product before the form (§5.2) |
| 3 | Signup → onboarding done | Completion % | Onboarding friction | **80%** | Cut steps; DOB wheel is a known friction point |
| 4 | **Onboarding → ACTIVATION** | **% marking ≥1 activity Done in 24h** | **The event that matters** | **40%** | Prompt earlier, make first activity trivially easy |
| 5 | D1 return | % returning next day | Nudge quality | 45% | Put the activity *inside* the nudge |
| 6 | **D7 retention** | **% active on day 7** | **PMF signal** | **30%** | ⚠️ **Stop acquisition. Fix product.** |
| 7 | D30 retention | % active on day 30 | Habit formed | 25% | Reports, deepen personalisation |
| 8 | Referral | Share rate / coefficient | Organic growth | 25% / 0.15 | Improve card design, change trigger moment |
| 9 | Paid conversion | Free → paid % | Monetization | 3% | Move paywall; re-test price |
| 10 | Revenue | MRR + workshop revenue | Business | ₹75k/mo by d120 | Re-examine value prop |

### 13.2 Track from day one (non-negotiable)

- Signup, onboarding step completion & drop-off
- **Activation** (activity marked Done)
- D1 / D7 / D30 retention cohorts
- Feature touch: Today / Milestones / Vaccinations / Copilot / Parent Care / Meals
- Copilot: questions asked, errors
- Session count and length

### 13.3 Introduce later (day 60+)

- Referral attribution chains
- Revenue cohorts, LTV, CAC by channel
- Report open rates
- Course/workshop completion
- NPS

### 13.4 The one number

> **Weekly cohort D7 retention.** If this isn't ≥30% by day 45, nothing else in this document matters. Fix it before spending a rupee on acquisition.

---

## 14. 30 / 60 / 90-Day Roadmap

### Days 1–30 — *Instrument, fix, recruit*
**Theme: earn the right to grow.**

| # | Initiative | Owner | Effort | Impact | Metric | Timeline |
|---|---|---|---|---|---|---|
| 1 | **Install PostHog + instrument full funnel** | Eng | 2d | 🔴 Critical | Funnel visible | D1–3 |
| 2 | **Hide Community tab** (ships fake data) | Eng | 2h | 🔴 Critical (trust) | Zero fabricated content live | **D1** |
| 3 | **Persist Copilot conversations** | Eng | 1d | 🟠 High | Threads survive reload | D3–5 |
| 4 | Fix waitlist `child_stage` data loss | Eng | 3h | 🟠 High | Segmentation captured | D3 |
| 5 | Add "what's hardest right now?" to onboarding | Eng | 1d | 🟠 High | Segment coverage >90% | D5–7 |
| 6 | Website: show live sample plan before form | Eng/Design | 3d | 🟠 High | Signup conv. 8% | D7–12 |
| 7 | **Recruit 50 beta mothers (6–24mo) by hand** | Founder | Ongoing | 🔴 Critical | 50 activated | D7–30 |
| 8 | Daily WhatsApp nudge (manual is fine) | Founder | 30m/day | 🟠 High | D1 return 45% | D10+ |
| 9 | **10 user interviews, recorded** | Founder | 5h | 🔴 Critical | 10 done | D15–30 |
| 10 | Instagram: 10 activity Reels (Exp. 1) | Founder | 6h | 🟡 Medium | 25 signups | D10–30 |
| 11 | Approach 3 pediatric clinics (Exp. 2) | Founder | 4h | 🟠 High | 1 signed | D20–30 |

**Gate:** Activation ≥ 40%, D7 ≥ 30%, 10 interviews done.

---

### Days 31–60 — *Prove a channel and a rupee*
**Theme: does anyone bring a friend, and does anyone pay?**

| # | Initiative | Owner | Effort | Impact | Metric | Timeline |
|---|---|---|---|---|---|---|
| 12 | **Milestone share card → WhatsApp** (Exp. 3) | Eng/Design | 4d | 🔴 Critical | 25% share rate | D31–38 |
| 13 | Co-parent invite flow | Eng | 3d | 🟠 High | 20% invite rate | D38–45 |
| 14 | **Sell first paid workshop, ₹499** (Exp. 5) | Founder | 1wk | 🔴 Critical | **20 seats** | D35–50 |
| 15 | Automate WhatsApp nudges | Eng | 3d | 🟠 High | D7 ↑ 5pts | D40–48 |
| 16 | Surface Parent Care at day 3 | Eng | 1d | 🟡 Medium | 30% touch rate | D45 |
| 17 | Scale to 300 users via best d1–30 channel | Founder | Ongoing | 🟠 High | 300 signups | D31–60 |
| 18 | Mom-community value drops (Exp. 4) | Founder | 3h/wk | 🟡 Medium | 20 signups | D31–60 |
| 19 | Vaccination due-date reminders | Eng | 2d | 🟠 High | D30 ↑ | D50–55 |
| 20 | **Fake-door Plus pricing test** | Eng | 1d | 🟠 High | Tap-through % | D55–60 |
| 21 | 2 more clinic partnerships | Founder | 6h | 🟡 Medium | 3 total live | D45–60 |

**Gate:** ≥20 workshop seats sold; one channel with CAC <₹150; D7 ≥30% sustained.

---

### Days 61–90 — *Monetize and scale what works*
**Theme: turn proof into revenue.**

| # | Initiative | Owner | Effort | Impact | Metric | Timeline |
|---|---|---|---|---|---|---|
| 22 | **Build Reports** (weekly/monthly) | Eng | 1.5wk | 🟠 High | 50% open rate | D61–72 |
| 23 | **Launch Plus subscription** *(gate: D30 ≥25%)* | Eng | 2wk | 🔴 Critical | **3% conversion** | D70–85 |
| 24 | 14-day trial at day-30 trigger | Eng | 3d | 🟠 High | 25% trial start | D80–85 |
| 25 | Workshops 2 & 3 + price ladder | Founder | 2wk | 🟠 High | Price curve | D61–90 |
| 26 | Double down on winning channel | Founder | Ongoing | 🔴 Critical | 1,500 users | D61–90 |
| 27 | Preschool/daycare pilot (2) | Founder | 1wk | 🟡 Medium | 2 signed | D70–90 |
| 28 | Micro-influencer test (3 × ₹5k) | Founder | 1wk | 🟡 Medium | CAC <₹200 | D75–90 |
| 29 | Start SEO content (compounds later) | Content | 2h/wk | 🟢 Low now | 10 pages live | D61–90 |
| 30 | **Paid ads** *(gate: LTV:CAC >3 only)* | Founder | — | 🟡 Conditional | ROAS >2 | D85+ |

**Gate to Phase 4:** 3% paid conversion, D30 ≥25%, LTV:CAC >3.

---

## 15. Priority Matrix

Scores 1–5. **Priority = (Value + Acquisition + Retention + Monetization) ÷ Effort.**

### 🔴 NOW

| Initiative | Val | Acq | Ret | Mon | Eff | Score |
|---|---|---|---|---|---|---|
| Install analytics | 5 | 5 | 5 | 5 | 1 | **20.0** |
| Hide Community (fake data) | 5 | 3 | 3 | 3 | 1 | **14.0** |
| Hand-recruit 50 beta mothers | 5 | 5 | 5 | 4 | 2 | **9.5** |
| Persist Copilot threads | 4 | 2 | 5 | 4 | 1 | **15.0** |
| Fix waitlist data loss | 3 | 4 | 2 | 2 | 1 | **11.0** |
| Daily WhatsApp nudge (manual) | 5 | 2 | 5 | 3 | 1 | **15.0** |
| "What's hardest" onboarding Q | 4 | 3 | 4 | 3 | 1 | **14.0** |
| 10 user interviews | 5 | 4 | 5 | 4 | 1 | **18.0** |
| Website shows product first | 4 | 5 | 2 | 3 | 2 | **7.0** |
| Instagram activity Reels | 3 | 5 | 2 | 2 | 2 | **6.0** |

### 🟠 NEXT (d31–60)

| Initiative | Val | Acq | Ret | Mon | Eff | Score |
|---|---|---|---|---|---|---|
| Milestone share card | 4 | 5 | 4 | 3 | 2 | **8.0** |
| First paid workshop | 4 | 4 | 3 | 5 | 2 | **8.0** |
| Automated nudges | 4 | 2 | 5 | 3 | 2 | **7.0** |
| Co-parent invite | 4 | 4 | 4 | 3 | 2 | **7.5** |
| Vaccination reminders | 5 | 2 | 5 | 3 | 2 | **7.5** |
| Pediatric clinic partnerships | 4 | 5 | 3 | 3 | 3 | **5.0** |
| Fake-door pricing test | 3 | 1 | 1 | 5 | 1 | **10.0** |

### 🟡 LATER (d61–90+)

| Initiative | Val | Acq | Ret | Mon | Eff | Score |
|---|---|---|---|---|---|---|
| Reports | 5 | 2 | 5 | 5 | 4 | **4.3** |
| Plus subscription | 4 | 1 | 3 | 5 | 4 | **3.3** |
| Courses (real content) | 4 | 3 | 3 | 4 | 5 | **2.8** |
| Preschool partnerships | 3 | 4 | 2 | 3 | 3 | **4.0** |
| SEO | 3 | 5 | 2 | 3 | 4 | **3.3** |
| Paid ads | 2 | 5 | 1 | 4 | 3 | **4.0** |

### 🛑 DO NOT BUILD YET

| Initiative | Why |
|---|---|
| **Community (real)** | Cold-start + moderation. Hide the mock; revisit at 5,000 users. |
| Development Kit | Physical product. Different business, different capital. |
| Product Guide | Needs a commercial-disclosure position first. |
| Expert marketplace | Two-sided. Not in 90 days. |
| Native iOS/Android apps | PWA is sufficient. Store presence isn't the bottleneck — retention is. |
| In-app billing infra | Razorpay link until there's a proven payer. |
| 2–7 year expansion | Win 6–24 months first. |

---

## 16. Top 10 Actions — start Monday

1. **Install PostHog and instrument the funnel.** *Nothing in this document is measurable until this exists.* (2 days)
2. **Hide the Community tab today.** It is serving fabricated parent discussions and fake expert replies to real users. This is a trust and integrity problem, not a feature gap. (2 hours)
3. **Define and implement the activation event** — activity marked Done within 24h — and put it on a dashboard. (1 day)
4. **Personally message all 11 waitlist signups.** Not a campaign. A conversation. Book 5 calls. (1 afternoon)
5. **Hand-recruit 50 mothers with children aged 6–24 months.** WhatsApp groups, apartment complexes, one friendly pediatrician. This is founder work and cannot be delegated. (weeks 1–4)
6. **Fix Copilot persistence.** A companion that forgets everything on reload is not a companion. Tables already exist. (1 day)
7. **Start the daily WhatsApp nudge manually.** Send today's actual activity to every beta parent, each morning. Don't automate it until you know it works. (30 min/day)
8. **Rewrite the website above-the-fold**: show a real, live sample plan for a chosen age *before* asking for anything. (3 days)
9. **Shoot 10 activity Reels** using activities already in the library. The content is written; you're filming what you own. (6 hours)
10. **Book and sell one ₹499 live workshop for week 5.** Zoom + Razorpay link. This is the fastest possible answer to "will anyone pay us?" (1 week)

---

## Appendix A — Product audit summary

| Feature | Status | Notes |
|---|---|---|
| Onboarding | ✅ Live | 4 steps; DOB wheel is a friction point |
| Today's plan | ✅ Live, strong | 1,149 activities, 28 bands, deterministic, offline-tolerant |
| Milestones | ✅ Live | 137 milestones + achievement tracking |
| Vaccinations | ✅ Live | Real IAP/UIP schedule |
| Meal Planner | ✅ Live | 6 stages, nutrients, ~19 recipes |
| Copilot | ✅ Live | Groq Llama-3.3-70B, RLS-scoped, **not persisted** |
| Parent Care | ✅ Live | 7 areas, 33 topics, mother/father differentiated |
| Parent Mode | ✅ Live | Today, Copilot, Nutrition, Recovery |
| Courses & Workshops | 🟡 Scaffold | 5 courses/18 lessons seeded; **video URLs are placeholders** |
| Community | 🔴 **Mock data in production** | In-memory fixtures; **hide immediately** |
| Reports | 🟡 Honest scaffold | Needs activity history |
| Development Kit | 🟡 Honest scaffold | — |
| Product Guide | 🟡 Honest scaffold | — |
| Analytics | 🔴 **None** | **Blocker for everything** |
| Payments | 🔴 None | Use Razorpay link |
| Push / WhatsApp | 🔴 None | Start manual |
| Website + waitlist | ✅ Live | **11 signups**; possible `child_stage` data loss |

---

## Appendix B — Key risks

| Risk | Severity | Mitigation |
|---|---|---|
| **D7 retention is low and unfixable** | 🔴 Existential | Find out in 45 days, cheaply, before spending on acquisition |
| **Fabricated Community content erodes trust** | 🔴 High | Hide today |
| **We build more features instead of getting users** | 🔴 High | Feature freeze except the 6 fixes in §14 |
| Indian parents won't pay subscriptions | 🟠 Medium | Workshops first; annual-first pricing; B2B2C fallback |
| Founder-led acquisition doesn't scale | 🟠 Medium | Intentional — it's a learning phase, not a growth phase |
| Groq/LLM cost at scale | 🟡 Low | Cap free tier at 5 Q/week; monitor from day 1 |
| Single-city clinic strategy doesn't generalise | 🟡 Low | Prove in one city first, then template it |
