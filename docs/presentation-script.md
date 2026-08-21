# The Neighbourhood — Presentation Script

**Runtime:** 30 minutes — 26 min talking + demo, ~4 min Q&A
**Audience:** mixed — founder/business plus some technical
**Companion deck:** `docs/presentation-deck.html` (open in a browser; `→` / `←`
to move, `S` for speaker notes, click the clock to start your 30-minute timer)

**Format:** `[STAGE DIRECTION]` = do this, don't say it. Everything else is
spoken. Slide numbers in `«…»` match the deck.

> **Supersedes the 14-minute version.** The product moved a long way after
> that script was written: the Copilot is real, Community is backed by
> Postgres, the activity library went from 56 to 1,149, and the navigation
> was rebuilt from a two-mode toggle into five flat tabs. Don't present the
> old numbers.

---

## 0. Before you start — 5 minutes of setup, done early

- [ ] Website open in a tab: the live Vercel URL
- [ ] Mobile web build in a second tab, **logged in, past onboarding**, sitting on Home
- [ ] A third tab with onboarding reset, so you can show the flow cold if asked
- [ ] **Phone on the table, app on the home screen** — this is your best prop
- [ ] Deck open in a fourth tab, full screen
- [ ] Supabase dashboard in a background tab (only if you expect a technical crowd)

**If the demo dies:** you have screenshots. Say *"Let me show you the stills,
the live one is being shy"* and keep moving. **Do not debug on stage.**

**Pacing anchors** — check the deck's rail against your own clock:
`9:20` you should be entering the parent side · `16:25` you should be off the
demo and onto engineering · `21:40` you should be starting the honest-status
section. If you're behind at 16:25, cut §10b (the bugs slide) — it's the
designated sacrifice. Content lands at **26:10**, leaving ~4 min for questions.

---

## 1. Open — what this is «1–2» · 0:00 → 1:35

`[Slide 1. Let the title sit for a beat before speaking.]`

> The Neighbourhood is a parenting app for the first seven years.
>
> I've built two things over the summer: the website that explains it and
> collects the waitlist, and the app itself — around eighty commits across
> two repositories, and a production database underneath both.

`[Slide 2 — the premise.]`

> The premise is narrow on purpose. The app answers **one question a day**:
> what should I actually do with my child today?
>
> Four things. One for each area of development, sized for the age they are
> this week. That's it. If you do nothing else in the app, you've had a good
> day.
>
> If I lose you at any point in the next half hour, that's the sentence to
> come back to. Everything else hangs off it.

---

## 2. Why this and not the alternatives «3» · 1:35 → 2:45

> Quickly on why this shape, because it's a reaction to what's already out
> there.
>
> Most parenting apps are one of two things. They're a **content library** —
> BabyCenter, What to Expect — thousands of articles you never read, where
> the work is search, and you have to already know what your problem is
> called before you can look it up. Or they're a **tracker** — feeds, naps,
> nappies — which turns your baby into a spreadsheet, where the work is data
> entry, and if you miss two days it becomes a guilt machine.
>
> Both of them hand the parent work.
>
> The third option is to tell the parent four things to do today, sized to
> their child's exact age, and then get out of the way. No searching, no
> logging debt.

---

## 3. What was actually shipped «4» · 2:45 → 3:55

`[Slide 4 — the scale slide. Don't read every number aloud; that's deadly.]`

> Before I demo it, the shape of what exists.
>
> Two products, one database. Seventeen tables in Postgres, twenty-six
> migrations, about thirty-three thousand lines across the app, the site and
> the SQL.
>
> The number I'd point at is the content: **1,149 activities**, across seven
> developmental domains and twenty-eight age bands covering nought to seven
> years. Plus 137 milestones and a 54-entry vaccination schedule.
>
> The website is live and taking signups. The app is installable to a phone
> home screen right now, from a link. Both talk to the same production
> Supabase project.

---

## 4. Demo — Home «5–6» · 3:55 → 7:35 ⭐ CENTREPIECE

### 4a. The four activities «5» — 2 min 30

`[Pick up the phone. Open the app from the home screen — physically doing
this is worth more than any slide. Wait for it to load. Do not talk over a
loading screen.]`

> This is the screen the whole product is built around.
>
> Four activities. One motor, one communication, one cognitive, one
> social-emotional. Every single day. Not a feed, not a library — four
> cards.

`[Tap into an activity. Show the how-to. Complete it. Come back.]`

> Each one takes a few minutes, with things you already own. You tap in, you
> do it, you mark it done, and the progress ring fills. Four out of four is
> an achievable day — which matters, because a parenting app you fail every
> day is a parenting app you delete.
>
> Now, **why four, and why those four.** Development isn't one thing. A
> parent doing plenty of talking and no crawling practice has a gap they
> can't see. By giving exactly one activity per domain, the balance becomes
> *structural* — you can't accidentally over-index on the thing you're
> already good at.
>
> And if one doesn't suit you, you can swap it — and you get a different
> activity **in the same domain**. You never lose the balance.

### 4b. The plan is a row, not a render «6» — 1 min 10

> There's an engineering decision hiding in that screen that's worth a
> minute, because it's what makes it feel solid.
>
> The plan is **generated once and then fixed** — the four activities are
> written to a row the first time you open the app that day. They don't
> reshuffle while you're looking at them.
>
> "Today" is **family-local**. Rollover uses the timezone we captured at
> signup, not the server's. UTC would roll an Indian family over at half
> past five in the morning — mid-morning, for a parent who's been up since
> four.
>
> And because it's persisted rather than regenerated, **you and your partner
> open the app to the identical day.** That's a feature nobody asks for and
> everybody notices.

---

## 5. Demo — Child «7» · 7:35 → 9:20

`[Open the Child tab. Show Discoveries, then Vaccinations.]`

> Home is today. Child is everything else — the reference material.
>
> **Discoveries** is 137 developmental milestones, and you tick them off as
> your child hits them. They're shown as ranges, never deadlines — milestones
> are the single most anxiety-producing thing in parenting content.
>
> I renamed this from "Milestones" late in the build, and I think the rename
> is the whole point: a milestone is something you can *miss*. A discovery is
> something that *happens*. Same data, different relationship.

`[Open Vaccinations.]`

> **Vaccinations** is sourced from the Indian government's Universal
> Immunisation Programme and the Indian Academy of Pediatrics schedule.
> Fifty-four entries, tiered three ways.
>
> **Essential** is the government schedule — free at any public facility,
> twenty-one entries. **Recommended** is what the IAP adds on top,
> twenty-six. **Situational** is outbreak or geography dependent, seven.
>
> That tiering is the useful bit. Most schedules present twenty vaccines as
> one undifferentiated wall, and a parent genuinely cannot tell what's
> non-negotiable from what's optional. Here they can.
>
> Two editorial rules: where the two schedules disagree, I keep both entries
> with a note rather than silently picking one. And rows say *"due"*, never
> *"overdue"* — the app can't know what happened at the clinic.

---

## 6. Demo — You «8–9» · 9:20 → 12:50 ⭐ YOUR DIFFERENTIATOR

### 6a. The second subject «8» — 1 min 50

`[Switch to the You tab. LET THE COLOUR CHANGE HAPPEN BEFORE YOU SPEAK.
The room will notice it. Quiet, slower delivery through this whole section.]`

> And this is the part I'm proudest of.
>
> Every parenting app on the market is about the child. The parent is a
> logistics layer — the person who administers the app to the baby. But in
> the first year the parent is also recovering, often badly, usually alone,
> and nobody is asking.
>
> So there's a whole tab for them. Their own daily check-in, nutrition that
> accounts for how they're feeding and how they're healing, and long-form
> care content — seven care areas, thirty-five topics.

`[Show the mood check-in.]`

> It opens by asking how you're feeling, and if you say tired, the day
> genuinely gets lighter — food you can assemble rather than cook, five
> minutes of movement instead of thirty.
>
> And watch the colour. The child side is warm cream; this side is a cooler
> eucalyptus at the same lightness. A parent opening this at 3am should feel
> the room change temperature — not the lights go out.

### 6b. The decision I'd defend «9» — 1 min 40 ⭐ BEST STORY IN THE TALK

`[Tell this as a story with a turn in the middle. Land the last line, then
pause before moving on.]`

> Two questions shape everything on this side: how you're feeding, and how
> your baby arrived. And I want to talk about where they're asked, because
> it's the most interesting product decision in the build.
>
> They used to be in onboarding. Step five of six.
>
> They are the two most loaded questions in postpartum life. A caesarean can
> carry real grief. Formula feeding carries stigma most parents have already
> been judged for. And we were asking both of them **before the parent had
> received a single thing from us** — at the last gate before the app even
> existed. That's a drop-off point, and worse than that, it's an intrusion.
>
> So I moved them. They're now asked the first time you deliberately step
> into your own space. The parent has already chosen to be there, so the
> question has an obvious reason — and anyone who never opens that tab is
> never asked at all.
>
> Both are optional. "Rather not say" is a real answer. The button is never
> disabled.
>
> Same two questions. Completely different relationship.

---

## 7. Demo — Ask and Community «10–11» · 12:50 → 15:05

### 7a. The Copilot «10» — 1 min 20

`[Open Ask. Type a real question. While it thinks, talk.]`

> The Copilot is the conversational layer, and it's real now — it was a
> scaffold that replied "I'm not connected" six weeks ago.
>
> It knows which child you're asking about and how old they are, and the
> system prompt narrows its subject depending on whether you opened it from
> the child side or your own side. One product, not two.

**[Technical half of the room — this is the bit for them:]**

> One decision worth naming. The model call does **not** go from the app.
> Expo ships every public environment variable inside the JavaScript bundle,
> which means an API key in the client is a *published* key, not a secret. So
> the call goes through a server-side function, and the key only ever exists
> there.
>
> And that function doesn't check ownership itself — it forwards the
> caller's own token and lets **row-level security** prove the child belongs
> to them. Same rule as every other table in the app, rather than a second
> permission system that could disagree with the first.

### 7b. Community «11» — 55 sec

> Community is the one deliberately shared corner of the product, and until
> two weeks ago it was fake — an in-memory array. Nothing anyone posted
> survived a refresh, and no two parents ever saw each other's posts.
>
> It's now five real tables. Any signed-in parent can read every discussion
> and write only their own — enforced in the database, so a bug in my query
> code can't become a way to edit someone else's post. Report, block and
> hide are built in from the start rather than retrofitted after the first
> incident. And discussions carry an age range, so you see what's live for
> parents at your stage.

---

## 8. The website «12» · 15:05 → 16:25

`[Switch to the website tab. Scroll slowly.]`

> The website is the front door, and it's live.
>
> One page that does the whole argument — what we're building, the
> developmental case for it, and a waitlist signup.

`[Pause at the growth animation.]`

> There's a scroll-driven animation of a child growing through the years,
> doing the emotional work the copy can't.

`[Pause at the milestone timeline, then the invitation card.]`

> A milestone timeline — "every child on their own clock" — same framing as
> the app. And it ends on an invitation rather than a signup form, which I
> think is a better last impression.
>
> Signups go into the same Supabase project the app uses, with a referral
> mechanic: share your link, move up the queue. There are proper legal pages.
> It's fully responsive with a real mobile nav.
>
> Fifty commits — and at one point I had four full design directions running
> in parallel. I collapsed them down to one and deleted the rest, because
> maintaining four versions of a landing page is how you end up shipping
> none of them.

---

## 9. What's underneath «13–14» · 16:25 → 19:20

**Read the room. If the business half is glazing over, read only the four
bold openers on «13» and move on — that's 40 seconds instead of two minutes.**

### 9a. Four decisions that shaped the schema «13» — 1 min 45

> Briefly on the engineering, because the app is the visible part of a
> fairly deliberate foundation. It's a real database, not local storage —
> seventeen tables in Postgres.
>
> **Plans are persisted, not regenerated** — I've covered that one.
>
> **Dates are family-local** — an IANA timezone on the profile, captured
> from the device.
>
> **The activity log snapshots its content.** When you complete something,
> the title, the domain and the age band are stored as columns — not a
> pointer to a library row. So when I edit the content library next month,
> your child's history doesn't silently rewrite itself. That one matters
> more than it sounds.
>
> **Every row is locked to the family that owns it** — twenty-six
> row-level security policies in the database itself, so ownership holds
> regardless of what the app does.
>
> Two smaller things: completion is offline-tolerant — you can tap with no
> signal, it looks instant, and it reconciles when you're back, with the
> server always winning. And "started" is tracked separately from
> "completed", so an abandoned activity is observable and starting something
> never inflates your count.

### 9b. Content as source code «14» — 1 min 10

> The content library is the piece that grew most. It started at fifty-six
> activities — two per domain per age band, which was enough to demo and not
> enough to live with, because one swap exhausted the pool.
>
> It's now **1,149 activities**, forty-one available in every single band,
> across seven domains and twenty-eight three-month bands from birth to
> seven years.
>
> And it's authored as a spreadsheet, compiled into a database migration by
> a script, and applied like any other schema change. So it's diffable,
> reviewable, in version control — and it *cannot* drift from its source,
> because the seed is generated rather than hand-maintained.

---

## 10. What I learned «15–16» · 19:20 → 21:40

### 10a. I shipped an idea users had to learn «15» — 1 min 20

> The navigation got rebuilt three times, and the third rebuild taught me
> something.
>
> It started as three tabs — Home, Copilot, Growth. Clean, but the parent
> had nowhere to exist in it.
>
> So I added **two modes**: Child Mode and Parent Mode, each with four tabs,
> swapped by a toggle in the header. And it worked. But "which mode am I in"
> became a thing the user had to hold in their head.
>
> It's now five flat tabs — Home, Community, Ask, Child, You. The colour
> still shifts as a wayfinding cue, but nothing about it is a concept anyone
> has to learn. They just pick a tab.
>
> The mode toggle was a clever solution to a problem I had invented.
> Deleting it removed a concept from the product and cost nothing.

### 10b. The first diagnosis was wrong «16» — 1 min

**⚠ This is the designated cut if you're behind schedule.**

> Three bugs worth mentioning, because of what they have in common.
>
> The website's milestone timeline claimed a child's vocabulary **shrank**
> between ten and fifteen months. And the copy promised cognitive
> development while the generator silently dropped it with a `slice`. Those
> are content bugs, not styling bugs, and they're invisible unless you
> actually sit down and read your own product.
>
> Second: a card that scrolled inside itself. Decorative shapes positioned
> outside a card's edges still count toward its scroll height — so the card
> became scrollable despite `overflow: hidden`, and tabbing to the button
> scrolled it by exactly the overshoot. It would have hit every keyboard
> user.
>
> And the thing I'd actually take from it: on that one, **my first diagnosis
> was wrong.** I restructured the whole component around a theory about CSS
> filters. The measurements came back identical — which is what disproved
> it. The real cause only turned up because I kept measuring after I thought
> I'd already found it.

---

## 11. Where it actually stands «17–18» · 21:40 → 24:30

**⭐ DO NOT SKIP. Volunteering the gaps is what makes everything before it
credible. Deliver it evenly — it's a status report, not a confession.**

### 11a. Real, scaffolded, missing «17» — 1 min 40

> Let me be straight about what's finished and what isn't.
>
> **Working end to end:** onboarding, the four-activity Home, Discoveries,
> Vaccinations, the whole parent side, the Copilot, Community, and the
> entire data layer. Real accounts, real database, verified against
> production.
>
> **Scaffolded, not built:** Reports, the Development Kit and the Product
> Guide are routed, designed and navigable, with content still to come.
> Courses and Workshops have structure and seeded lessons, but the video
> URLs are placeholders.
>
> **Needs outside input rather than more code:** the vaccination schedule is
> transcribed accurately from the UIP and IAP sources, but it is medical
> content in a parenting app. It needs a paediatrician to sign it off before
> anyone relies on it. That's a clinical review, and I'm not qualified to be
> the last set of eyes on it.
>
> **Not yet built at all:** no analytics — which means I currently cannot
> answer "did anyone come back on day two?". No payments, no push
> infrastructure. And milestone coverage thins out after age five.
>
> **One flaw I'd fix before real users:** we ask how you gave birth without
> first establishing whether you're the birthing parent. For an adoptive
> parent, or a father, that question is wrong on its face. The fix is small —
> ask the relationship first — but it's a good example of the kind of thing
> you only catch by reading your own product back slowly.

### 11b. I audited it, then acted on it «18» — 1 min 10

> In August I wrote a strategy document that audited my own codebase, and it
> named five things that were misrepresented in the product. Two of the
> biggest are now closed.
>
> **Community was mock data** — fabricated parents, fabricated expert
> replies, shipped to production. That's now real Postgres with moderation.
> And **the Copilot forgot everything on reload** — the tables existed,
> nothing wrote to them. Conversations now persist per child.
>
> Still open, correctly: no analytics, no payments, placeholder course
> videos. And the waitlist has **eleven signups**. It isn't a pipeline. It's
> a form on a page nobody visits yet.
>
> The strategic conclusion I reached, and still hold: **don't build more
> features.** The single question that decides whether this is a business is
> whether a parent opens it on day seven — and I have no instrumentation to
> answer that.

---

## 12. Next, and close «19–20» · 24:30 → 26:10

> So the next ninety days are, in order: **instrument** — analytics first,
> because nothing else can be evaluated without it. **Fix integrity** — no
> placeholder content anywhere a user can reach. **Hand-recruit a hundred
> real parents**, enough to measure day-seven retention honestly. And **sell
> one workshop**, to prove willingness to pay before building a subscription
> on top of retention I haven't demonstrated.
>
> Alongside that, the content library keeps growing — that's what turns this
> from a schedule into something a parent can live inside for a year.

`[Slide 20. Hold up the phone.]`

> So: a live website taking signups, an app you can put on your phone right
> now, and a database built to hold real families rather than a demo.
>
> On distribution — it's a web build, so it's a URL. Anyone with the link is
> in. No app store, no TestFlight, no invite list. Add to home screen and
> you get an icon, a splash screen and no browser chrome; for a tester it's
> indistinguishable from a native app. Shipping to the App Store later is a
> packaging step, not a rewrite — same code.
>
> Thank you. Happy to take questions — and if anyone wants the link on their
> phone, I'll send it now.

---

## Q&A — prepared answers · 26:10 → 30:00

**"How is this different from BabyCenter or What to Expect?"**
> Those are content libraries — search-and-read, and the work is on you.
> This tells you four things to do today and gets out of the way. And
> they're about the child only; we have a whole second side for the parent,
> which nobody in this market has.

**"Where does the content come from?"**
> Activities and milestones are written against standard developmental
> frameworks and organised into age bands. The vaccination schedule is
> transcribed from the government UIP schedule and the IAP schedule — never
> reconstructed from memory. All of it is in version control. And all of it
> needs expert review before launch; I'd say that to a user too.

**"Is this medical advice?"**
> No, and it shouldn't present as it. It's developmental play guidance plus
> a vaccination reference. The vaccination section in particular needs a
> clinician's sign-off and a clear disclaimer before launch. That's on the
> list, and it's a blocker rather than a nice-to-have.

**"What about privacy? This is children's data."**
> Every row is scoped to the owning family in the database itself, not in
> app code — twenty-six policies. There are published privacy, terms and
> cookie pages. That said, a real children's-data product also needs a
> data-deletion path and a proper look at what applies in our jurisdiction.
> That's a launch requirement I haven't finished.

**"Why is the AI call going through a server function?"**
> Because Expo inlines public environment variables into the JavaScript
> bundle. A key in the client is readable by anyone who opens the app, so
> it isn't a secret. The function holds the key; the app never sees it.

**"How long did this take?"**
> About six weeks — 11 July to 21 August. Eighty commits: thirty on the app,
> fifty on the website. The website went through four full design directions
> before it settled.

**"Why web instead of native?"**
> Distribution. Sending a link beats a TestFlight invite for getting real
> feedback fast. It's React Native via Expo, so the same code compiles to
> real iOS and Android builds when we want them — a packaging step, not a
> rewrite.

**"What's the business model?"**
> Not finally decided, and deliberately so. The plan I'd argue for is
> workshops first — a fixed-price paid workshop proves willingness to pay in
> three weeks with a payment link and no new code — and a subscription only
> after day-thirty retention justifies it. There's also a product guide
> section that's an obvious affiliate surface.

**"Only eleven waitlist signups?"**
> Yes, and I'd rather say that than dress it up. I've been building the
> product, not distributing it. That's exactly why the next ninety days are
> instrumentation and hand-recruiting rather than more features.

**"Can I try it?"**
> Yes — right now. `[send the link]`

---

## Delivery notes

- **Your two strongest moments are the four-domain Home «5» and the parent
  side «8–9».** Everything else is supporting material. If you're running
  long, cut the bugs slide «16» and compress the engineering «13» — never
  those two.
- **Demo the phone, don't just describe it.** Physically opening the app
  from your home screen beats any slide.
- **Let the colour change on «8» happen in silence.** It does the work for
  you.
- **Section 11 is your credibility.** People trust a builder who names their
  own gaps more than one who presents a finished-looking thing.
- **Don't apologise for the scaffolded parts.** "Routed and designed, not
  functional" is a status, not a confession.
- **Say the eleven-signups number out loud.** Hiding it would undercut the
  honesty you just spent two minutes buying.
- If you blank, the thread is: **one question a day → four activities → and
  the parent matters too.** Everything hangs off that.
