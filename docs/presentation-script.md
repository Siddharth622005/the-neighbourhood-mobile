# The Neighbourhood — End-of-Internship Presentation

**Runtime:** 30 minutes — 25:20 talking + demo, ~4:40 Q&A
**Audience:** mixed — founder/business plus some technical
**Shape:** a progress lifecycle. Six phases, in order, derived from the
actual commit history — not a feature tour.
**Companion deck:** `docs/presentation-deck.html` (`→` / `←` to move, `S` for
speaker notes, click the clock to start your 30-minute timer)

**Format:** `[STAGE DIRECTION]` = do this, don't say it. Everything else is
spoken. Slide numbers in `«…»` match the deck.

---

> ## ⚠ Before you present: three slides need filling in
>
> Slides **15, 16 and 17** are the other three interns, and they're
> placeholders — I don't have their names or anything about them. Every gap
> is marked in dashed red on the slide so you can't miss one. Fill them in,
> or cut those three slides and take 3 minutes off the runtime.
>
> See **§8** below for what to write.

---

## Why this shape

The previous version of this talk was a feature tour — here's Home, here's
the Child tab, here's the database. It worked, but it asked the room to hold
twelve unrelated things in their head.

This version tells the story in the order it actually happened. Six phases,
each one only possible because the previous one finished. The room only ever
has to hold **one** thing: where you are in the arc. The features still get
shown — they just arrive as consequences of a decision rather than as items
on a list.

**The six phases:**

| # | Phase | When | What changed |
|---|---|---|---|
| 01 | Prototype | 11–12 Jul | Tested the idea on a webpage before building an app |
| 02 | Position | 22–23 Jul | Writing the pitch forced the product definition |
| 03 | Shell | 21–25 Jul | Nothing to an installable app in four days |
| 04 | Spine | 26–27 Jul | A real database — demo becomes product |
| 05 | Widen | 30 Jul – 10 Aug | Subject widens from child to whole family |
| 06 | Close the gap | 12–21 Aug | Made true everything that was pretending |

---

## 0. Setup — do this 5 minutes early

- [ ] Deck open full screen, timer reset
- [ ] Phone on the table, app already on the home screen — **your best prop**
- [ ] Mobile web build in a tab, **logged in, past onboarding**, sitting on Home
- [ ] Website open in a second tab
- [ ] Screenshots ready in a third tab, in case the demo dies
- [ ] **Slides 15–17 filled in** ⚠

**If the demo dies:** switch to the stills, say *"the live one is being shy"*,
keep moving. **Do not debug on stage.**

**Pacing anchors** — check the deck's rail against your clock:
`8:45` entering Phase 05 (the parent side) · `13:45` you should be picking up
the phone · `21:00` you should be starting the intern section. Content lands
at **25:20**.

---

## 1. Open «1–2» · 0:00 → 1:30

`[Slide 1. Let it sit for a beat before you speak.]`

> Over the last six weeks I built two things for The Neighbourhood — the
> website, and the app. Eighty commits across two repositories.
>
> But rather than walk you through every screen, I want to tell it in the
> order it happened. Because the interesting part isn't the feature list —
> it's that the thing changed shape six times, and each change was forced by
> something I learned from the version before it.

`[Slide 2 — what the product is.]`

> First, one sentence on what it actually is. The app answers **one question
> a day**: what should I actually do with my child today?
>
> Four activities, one for each area of development, sized for the age they
> are this week. That's the product. Everything I built over six weeks was
> in service of making that one screen true.

---

## 2. The arc «3» · 1:30 → 3:00 ⭐ THE SPINE

`[Slide 3. Walk the six phase names left to right with your hand.]`

> This is the whole internship on one slide, and it's the map for the next
> twenty minutes.
>
> Six phases. Two tracks running in parallel — the website along the top, the
> app along the bottom — and you can see they overlap rather than hand off.
> The website wasn't finished before the app started; they fed each other.
>
> And the thing I'd point at: **each phase only became possible because the
> one before it finished.** You can't widen a product that has no spine, and
> you can't give a spine to something that doesn't exist yet.
>
> I'll take these one at a time.

**[This promise is what makes the next six slides easy to follow. Make it
explicitly.]**

---

## 3. Phase 01 — Prototype «4» · 3:00 → 4:15

> **Phase one. Two days in July, and not a line of app code.**
>
> The first thing I built wasn't the app. It was a page on the website — a
> "One Day, Lived" walkthrough that showed a parent what a single day inside
> this product would actually feel like.
>
> The reason is the lesson. A webpage takes a day; an app takes weeks. The
> riskiest question about this product was whether "here are four things to
> do today" reads as *help* or as *homework*. I wanted to find that out on
> the cheap page, not after building the expensive thing.
>
> It settled two decisions that survived all the way into the shipped app:
> the daily-activity loop was worth building, and the tone had to be
> permission-giving rather than instructional.

---

## 4. Phase 02 — Position «5» · 4:15 → 5:30

> **Phase two. Eight commits in two days, all of it writing.**
>
> An editorial homepage: a video hero, "Why We Exist", the developmental
> argument, a milestone timeline. Values written around the TRICK framework.
> The AI companion named explicitly for the first time.
>
> And here's what I didn't expect. **Writing the pitch is what defined the
> product.** You cannot write a landing page for something you can't explain
> in a sentence — so forcing the copy forced the definition. The homepage
> became the spec, and the app was then built against it.
>
> Structure emerged here too: Story, Values and FAQ moved off the homepage
> onto their own routes. The homepage's job is the pitch. Those pages are for
> someone who wants more before they commit.

---

## 5. Phase 03 — Shell «6» · 5:30 → 7:00

> **Phase three. From nothing to an app on a phone in four days.**
>
> Foundation and onboarding, then navigation, then the screen the whole
> product is built around: four activities a day, one per developmental
> domain.
>
> Three decisions from this phase.
>
> **One question per screen.** Onboarding asks one thing at a time. The
> birthday gets its own screen with a proper picker, because everything
> downstream — which activities you get, which milestones show, which
> vaccines are due — is computed from that single date.
>
> **Auth turned off.** Onboarding silently creates a real account behind the
> scenes, so security still works properly — but the parent never sees a
> sign-up step. That was a deliberate trade: device-bound until you link an
> email, in exchange for nobody bouncing off a registration wall.
>
> **Installable from a link.** It ships as a web build you add to your home
> screen. No app store, no TestFlight. Testers were one link away by day
> five.
>
> This is where the product first existed as a thing you could hold. It was
> also entirely fake underneath — nothing was saved anywhere.

---

## 6. Phase 04 — Spine «7» · 7:00 → 8:45

> **Phase four. Two days that turned a demo into a product.**
>
> A real Postgres schema, seeded content, every screen rewired to read and
> write it.
>
> One thing from this phase I'd mention even to a non-technical room. I
> probed the live database directly rather than trusting my own migration
> files — and found the tables I *thought* existed had never actually been
> applied. The app had been writing to tables that weren't there, and the
> errors were being silently swallowed. Check the real thing, not your
> notes about the real thing.
>
> Four decisions shaped the schema:
>
> **Plans are persisted, not regenerated.** Today's four activities are a
> row in a table. They don't reshuffle while you're looking at them, and
> they're identical on your partner's phone.
>
> **Time is family-local.** Rollover uses your timezone, not the server's.
> UTC would roll an Indian family over at half past five in the morning.
>
> **History is snapshotted.** Completing an activity stores what it said *at
> the time*, not a pointer to it. So when I edit the content library next
> month, your child's history doesn't silently rewrite itself.
>
> **Every row is locked to the family that owns it** — in the database
> itself, so it holds regardless of what the app does.

---

## 7. Phase 05 — Widen «8» · 8:45 → 10:45 ⭐ EMOTIONAL PEAK

`[Let the slide's colour change land before you speak. Slower, quieter here.]`

> **Phase five, and this is the one I'm proudest of.**
>
> The subject widened from the child to the whole family.
>
> Every parenting app on the market treats the parent as a logistics layer —
> the person who administers the app to the baby. But in the first year the
> parent is also recovering, often badly, usually alone, and nobody is
> asking.
>
> So they got their own side of the product. Seven care areas, thirty-five
> topics, a daily check-in, nutrition staged to how they're feeding and how
> they're healing. And notice the colour — the child side is warm cream,
> this side is a cooler eucalyptus at the same lightness. A parent opening
> this at 3am should feel the room change temperature, not the lights go
> out.

**[Now the story. This is the best two minutes in the talk — take them.]**

> And one decision here I'd defend anywhere.
>
> Two questions shape that side of the app: how you're feeding, and how your
> baby arrived. They used to sit in onboarding, step five of six.
>
> They are the two most loaded questions in postpartum life. A caesarean can
> carry real grief. Formula feeding carries stigma most parents have already
> been judged for. And we were asking both of them **before the parent had
> received a single thing from us** — at the last gate before the app even
> existed.
>
> So I moved them. They're now asked the first time you deliberately step
> into your own space. The parent has already chosen to be there, so the
> question has an obvious reason — and anyone who never opens that tab is
> never asked at all. Both optional. "Rather not say" is a real answer.
>
> Same two questions. Completely different relationship.

`[Pause here.]`

---

## 8. Phase 06 — Close the gap «9» · 10:45 → 12:30

> **Phase six. The last two weeks, and the phase I'd actually want to be
> judged on.**
>
> In August I audited my own codebase and wrote down everything that looked
> finished but wasn't. Then I spent the rest of the time closing it.
>
> **Community was fabricated.** It was an in-memory array of invented parents
> and invented expert replies — shipped to production, wiped on every
> reload. No two parents ever saw each other's posts. It's now five real
> tables, with report, block and hide built in from the start rather than
> retrofitted after the first incident.
>
> **The Copilot didn't answer.** It accepted your question and replied that
> it wasn't connected. It now runs a real model through a server-side
> function, scoped to your own child, with the conversation saved so it
> survives a reload.
>
> In the same stretch the activity library went from **56 to 1,149**
> activities. And "Milestones" became "Discoveries" — because a milestone is
> something you can *miss*, and a discovery is something that *happens*.
> Same data, different relationship. Same idea as moving those two questions.

---

## 9. Where it landed «10» · 12:30 → 13:45

`[Don't read every number aloud — that's deadly.]`

> So at the end of the six phases: two products, one database, about
> thirty-three thousand lines.
>
> The number I'd point at is the content — **1,149 activities**, across seven
> developmental domains and twenty-eight age bands covering nought to seven
> years. Plus 137 milestones and a 54-entry vaccination schedule sourced from
> the government UIP schedule and the Indian Academy of Pediatrics.
>
> A live website taking signups, an app installable from a link, and one
> production database underneath both.

---

## 10. Demo «11» · 13:45 → 17:45

`[PICK UP THE PHONE. Open from the home screen — physically doing that beats
any slide. Wait for it to load; don't talk over a loading screen.]`

**Four stops, roughly a minute each. Keep moving.**

**Home** — *"This is the screen the whole product is built around."* Tap into
an activity, complete it, show the ring fill.
> Four out of four is an achievable day, which matters — a parenting app you
> fail every day is a parenting app you delete. And if one doesn't suit you,
> you swap it and get a different activity *in the same domain*, so you never
> lose the balance.

**Child** — Discoveries, then Vaccinations.
> Milestones as ranges, never deadlines. And the vaccination schedule is
> tiered three ways: **essential** is the government schedule, free at any
> public facility. **Recommended** is what the IAP adds. **Situational** is
> outbreak or geography dependent. Most schedules present twenty vaccines as
> one undifferentiated wall and a parent can't tell what's non-negotiable
> from what's optional. Here they can.

**You** — `[let the colour change happen in silence]`
> The parent's own side — you've already heard why.

**Ask** — type a real question.
> It knows which child you're asking about and how old they are.

---

## 11. What the phases taught me «12» · 17:45 → 19:15

> Three things I'd carry into the next thing I build, and each one comes out
> of a specific phase.
>
> **Prototype in the cheapest medium that can still be wrong.** A webpage
> answered the riskiest question about this product before any app code
> existed. That's phase one.
>
> **If users have to learn your idea, delete the idea.** The app briefly had
> two modes — a child mode and a parent mode — swapped by a toggle in the
> header. It worked. But "which mode am I in" became something the user had
> to hold in their head. Five flat tabs replaced it and cost nothing. The
> toggle was a clever solution to a problem I had invented. That's phase
> five.
>
> **Audit your own work before someone else does.** Writing down what was
> pretending to be finished was uncomfortable, and it directly produced the
> last two weeks of real work. That's phase six.

---

## 12. Honest status «13» · 19:15 → 21:00

**⭐ DO NOT SKIP. Volunteering the gaps is what makes everything before it
credible. Even delivery — a status report, not a confession.**

> Let me be straight about what's real and what isn't.
>
> **Working end to end:** onboarding, the four-activity Home, Discoveries,
> Vaccinations, the whole parent side, the Copilot, Community, and the entire
> data layer. Real accounts, real database, verified against production.
>
> **Scaffolded:** Reports, the Development Kit and the Product Guide are
> routed and designed, with content still to come. Courses and Workshops have
> structure and seeded lessons but placeholder video URLs.
>
> **Needs a clinician:** the vaccination schedule is transcribed accurately
> from the UIP and IAP sources, but it is medical content in a parenting app.
> It needs a paediatrician to sign it off before anyone relies on it. That's
> a clinical review, and I'm not qualified to be the last set of eyes on it.
>
> **Not yet built:** no analytics — which means I currently cannot answer
> "did anyone come back on day two?". No payments. And the waitlist has
> **eleven signups**. It isn't a pipeline yet. It's a form on a page nobody
> visits.

**[Say the eleven out loud. Hiding it would undercut the honesty you just
spent two minutes buying.]**

---

## 13. The other three interns «14–17» · 21:00 → 24:30

**⚠ SLIDES 15–17 ARE PLACEHOLDERS. Fill them before you present.**

`[Slide 14. Change your register — you're done presenting your own work.
Slow down, warm up, look at the room rather than the screen. If the three of
them are here, find them.]`

> Before I finish — I wasn't the only one here this summer. Three other
> interns shaped what I built, and I want to say something about each of
> them.

**Then one slide each, about a minute per person.**

### How to fill these in

Each slide has four slots. Keep it concrete — **specific beats flattering**.
"She found the bug in the milestone data that I'd been staring past for two
days" is worth ten times "she was a great teammate".

| Slot | What to write |
|---|---|
| **Name** | Their name as they'd want it said |
| **One line** | What they worked on this summer, in a sentence |
| **What they built** | The thing they actually owned |
| **Interesting fact** | The thing the room doesn't know — a background, a skill, a story |
| **What I took from them** | Something you genuinely learned or reused |

**Three things that make this section land:**

1. **Vary the shape.** If all three slides read as the same four-item list,
   it becomes a template and the warmth drains out. Let one be a short
   anecdote instead.
2. **Connect at least one of them to your own work.** "The reason the
   vaccination tiers are structured that way is a conversation with ___" is
   far stronger than a parallel list of separate achievements — it shows the
   summer was collaborative rather than four people in four corners.
3. **End the third one warmly.** It's the last thing before your close, so
   it sets the temperature you finish on.

**If you can't fill these in:** cut slides 15–17 entirely and keep slide 14
as a single generous sentence about all three. That's a clean 3-minute cut
and much better than presenting placeholder text.

---

## 14. Close «18» · 24:30 → 25:20

`[Back to the arc — that's what makes this a story rather than a list.]`

> So: prototype, position, shell, spine, widen, and then close the gap.
>
> That last phase is the one I'd want to be judged on. Anyone can add
> features. Going back through your own product, writing down what's
> pretending to be finished, and then making it true — that's the harder
> half, and it's the half I didn't expect to be the most valuable thing I did
> here.
>
> The app is a URL. If anyone wants it on their phone, I'll send the link
> now.
>
> Thank you — happy to take questions.

---

## Q&A — prepared answers · 25:20 → 30:00

**"How is this different from BabyCenter or What to Expect?"**
> Those are content libraries — search-and-read, and the work is on you. This
> tells you four things to do today and gets out of the way. And they're
> about the child only; we have a whole second side for the parent, which
> nobody in this market has.

**"Where does the content come from?"**
> Activities and milestones are written against standard developmental
> frameworks and organised into age bands. The vaccination schedule is
> transcribed from the government UIP schedule and the IAP schedule — never
> reconstructed from memory. All of it is in version control, and all of it
> needs expert review before launch. I'd say that to a user too.

**"Is this medical advice?"**
> No, and it shouldn't present as it. It's developmental play guidance plus a
> vaccination reference. That section in particular needs a clinician's
> sign-off and a clear disclaimer before launch — a blocker, not a
> nice-to-have.

**"What about privacy? This is children's data."**
> Every row is scoped to the owning family in the database itself, not in app
> code. There are published privacy, terms and cookie pages. That said, a
> real children's-data product also needs a data-deletion path and a proper
> look at what applies in our jurisdiction — that's a launch requirement I
> haven't finished.

**"Why web instead of native?"**
> Distribution. Sending a link beats a TestFlight invite for getting real
> feedback fast. It's React Native via Expo, so the same code compiles to
> real iOS and Android builds when we want them — a packaging step, not a
> rewrite.

**"How did you decide what to build next?"**
> Mostly the previous phase decided it. The shell made it obvious the data
> layer was the blocker; the data layer made it possible to widen the
> subject; widening it made the two-mode navigation collapse under its own
> weight. The one time I chose freely rather than followed the constraint was
> phase six, and that came out of the audit.

**"What's the business model?"**
> Not finally decided, deliberately. The plan I'd argue for is workshops
> first — a fixed-price paid workshop proves willingness to pay in three
> weeks with a payment link and no new code — and a subscription only after
> retention justifies it.

**"Only eleven waitlist signups?"**
> Yes, and I'd rather say it than dress it up. I've been building the
> product, not distributing it. That's exactly why the next stretch is
> instrumentation and hand-recruiting rather than more features.

**"Can I try it?"** → `[send the link]`

---

## Delivery notes

- **The arc slide «3» is doing the most work in this deck.** If the room
  understands the six phases there, every later slide has a place to land.
  Don't rush it.
- **Your two strongest moments are Phase 05 «8» and Phase 06 «9».** If you're
  running long, compress Phase 01 and 02 — never those two.
- **Demo the phone, don't just describe it.**
- **Let the colour change on «8» happen in silence.** It does the work for
  you.
- **Section 12 is your credibility.** Don't apologise for the scaffolds —
  "routed and designed, not functional" is a status, not a confession.
- If you blank, the thread is: **prototype → position → shell → spine →
  widen → close the gap.** Six words, in order, and you can rebuild the
  whole talk from them.
