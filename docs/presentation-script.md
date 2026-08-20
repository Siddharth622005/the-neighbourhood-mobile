# The Neighbourhood — Presentation Script

**Runtime:** ~14 minutes talking + demo, ~5 min Q&A
**Format:** `[STAGE DIRECTION]` = do this, don't say it. Everything else is spoken.

---

## 0. Before you start (5 min setup, do this early)

- [ ] Website open in a tab: the live Vercel URL
- [ ] Mobile web build open in a second tab, **logged in, past onboarding**, sitting on Home
- [ ] A third tab with onboarding reset, so you can show the flow cold if asked
- [ ] Phone on the table with the app added to the home screen — this is your best prop
- [ ] Supabase dashboard open in a background tab (only if you expect a technical audience)

**If the demo dies:** you have screenshots. Say *"Let me show you the stills, the live one is being shy"* and keep moving. Do not debug on stage.

---

## 1. Open — what this is (60 seconds)

> The Neighbourhood is a parenting app for the first seven years.
>
> The premise is narrow on purpose. Most parenting apps are either a content library — thousands of articles you never read — or a tracker that turns your baby into a spreadsheet. Both of them hand you work.
>
> This one answers one question a day: *what should I actually do with my child today?* Four things, one for each area of development, sized for the age they are this week. That's it. If you do nothing else in the app, you've had a good day.
>
> I've built two things: the website that explains it and collects the waitlist, and the app itself. Let me show you the app first, because that's where the actual work is.

---

## 2. The mobile app (7 minutes — the heart of it)

### 2a. Onboarding (60 seconds)

`[Show the onboarding tab, or describe if short on time]`

> Onboarding is five questions and it's under a minute. Your name, your child's name, their birthday, their gender. One question per screen — not a form.
>
> Two decisions here I want to flag.
>
> First, the birthday is the single most important thing the app knows. Everything downstream — which activities you get, which milestones we show, which vaccines are due — is computed from that one date. So it gets its own screen and a proper picker.
>
> Second, we ask for the child's name and the parent's name on separate screens. Sounds trivial. But the whole app talks to you by name, and a parent typing both into one form reads as data collection. Split up, it reads as an introduction.

`[Show the "getting ready" screen if you can]`

> And then a real loading screen — a genuine progress bar, not a fake spinner, with three facts about early development while it commits your family to the database. About four seconds. If the save fails, it stops and offers a retry, because a parent who lands in the app with no child record has a broken account that looks like a working one.

### 2b. Home — the four activities (2 minutes) ⭐ **This is your centrepiece. Slow down.**

`[Home screen up]`

> This is the screen the whole product is built around.
>
> Four activities. One motor, one communication, one cognitive, one social-emotional. Every single day. Not a feed, not a library — four cards.
>
> Why four and why those four. Development isn't one thing. A parent doing a lot of talking and no crawling practice has a gap they can't see. By giving one activity per domain, the balance is structural — you can't accidentally over-index on the thing you're already good at.
>
> Each one takes a few minutes with things you already own. You tap in, you do it, you mark it done.

`[Tap into an activity, complete it, come back]`

> The progress ring fills as you go. Four out of four is an achievable day, which matters — a parenting app you fail every day is a parenting app you delete.
>
> The plan is generated once, in the morning, in **your** timezone, and then it's fixed. It doesn't reshuffle while you're looking at it. And it's stored — so if you open the app on another device, it's the same four activities. You and your partner see the same day.
>
> If one doesn't suit you, you can swap it — and you get a different activity in the same domain. You never lose the balance.

### 2c. Growth (90 seconds)

`[Open Growth tab]`

> Home is today. Growth is everything else — the reference material, six sections.
>
> **Milestones** is the biggest one.

`[Open Milestones]`

> About two hundred milestones across seven age bands, from nought-to-three months up to five-to-seven years, in all four domains. You can tick them off as your child hits them.
>
> The framing here is deliberate. Milestones are the single most anxiety-producing thing in parenting content, so these are shown as ranges, not deadlines. Every child on their own clock.

`[Open Vaccinations]`

> **Vaccinations** is sourced from the Indian government's Universal Immunisation Programme and the Indian Academy of Pediatrics schedule — fifty-four entries, tiered three ways.
>
> **Essential** is the government schedule, free at any public facility. **Recommended** is what the IAP adds on top. **Situational** is outbreak or risk-dependent.
>
> That tiering is the useful bit. Most schedules present twenty vaccines as one undifferentiated wall and a parent can't tell what's non-negotiable from what's optional. Here they can.

> The other four sections — the Guide, the development kit, reports, and a product guide — are built and navigable, with content still being filled in.

### 2d. Parent Mode (2 minutes) ⭐ **This is your differentiator. Land it.**

`[Tap the avatar, switch to Parent mode — let the colour change be visible]`

> And this is the part I'm proudest of.
>
> Every parenting app on the market is about the child. The parent is a logistics layer — the person who administers the app to the baby. But in the first year the parent is also recovering, often badly, usually alone, and nobody is asking.
>
> So there's a second mode. Same app, different subject. Watch the colour change — the child side is warm and cream, the parent side is a cooler green. Different space, not a different app.

`[Show the parent tabs]`

> Four tabs for the parent: today, nutrition, recovery, and their own copilot. How you're healing, what you can eat one-handed, and permission to have a lower-effort day.

`[Show the mood check-in]`

> It opens by asking how you're feeling. If you say tired, the day genuinely gets lighter — food you can assemble rather than cook, five minutes of movement instead of thirty.

`[Show the recovery welcome screen if you can trigger it]`

> Two questions shape this: how you're feeding, and how your baby arrived.
>
> Now — those two questions used to be in onboarding. Step five of six. And I moved them out this week, which I think is the most interesting product decision in the build.
>
> They're the two most loaded questions in postpartum life. A caesarean can carry real grief. Formula feeding carries stigma most parents have already been judged for. And we were asking both of them *before the parent had received a single thing from us* — at the last gate before the app even existed. That's a drop-off point, and worse, it's an intrusion.
>
> So now they're asked here, the first time you deliberately step into your own space. The parent has already chosen to be here, so the question has an obvious reason. Anyone who never opens this is never asked at all. Both are optional, "rather not say" is a real answer, and the button is never disabled.
>
> Same number of questions. Completely different relationship.

---

## 3. What's underneath (2 minutes — adjust for audience)

**If the room is non-technical, compress this to the three bolded lines and move on.**

> Quickly, on the engineering, because the app is the visible part of a fairly deliberate foundation.

> **It's a real database, not local storage.** Eleven tables in Postgres. Your family, your children, your daily plans, your activity history, your milestone ticks, your vaccination records.

> Four things I'd point at:
>
> **Plans are persisted, not regenerated.** Once today's four activities exist, they're a row. They don't change under you, and they're the same on every device.
>
> **Time is family-local.** "Today" is computed in the timezone we captured at signup, not the server's. A plan rolls over at your midnight.
>
> **The activity log is snapshotted.** When you complete something, we store what it actually said at the time — not a pointer to it. So when I edit the content library next month, your history doesn't silently rewrite itself.
>
> **Every row is locked to the family that owns it.** Row-level security in the database itself, so it holds regardless of what the app does.

> The app is offline-tolerant — you can tap complete with no signal, it looks instant, and it reconciles when you're back. The server always wins.
>
> Content is seeded and versioned as migrations: fifty-six activities, around two hundred milestones, fifty-four vaccination entries. All in source control, all reviewable.

---

## 4. The website (90 seconds)

`[Switch to the website tab]`

> The website is the front door. It's live.
>
> One page that does the whole argument — what we're building, the developmental case for it, and a waitlist signup.

`[Scroll — pause at the growth animation]`

> There's a scroll-driven animation of a child growing through the years, which is doing the emotional work the copy can't.

`[Scroll to the milestone timeline]`

> A milestone timeline — "every child on their own clock" — same framing as the app.

`[Scroll to the invitation card at the bottom]`

> And it ends on an invitation rather than a signup form, which I think is a better last impression.

> Signups go into the same Supabase project the app uses, with a referral mechanic — share your link, move up the queue.
>
> It's fully responsive with a proper mobile nav, and it's one homepage. I had four design directions running in parallel at one point; I collapsed them down to one and deleted the rest, because maintaining four versions of a landing page is how you end up shipping none of them.

---

## 5. Distribution — the practical answer (45 seconds)

`[Hold up your phone with the app on the home screen]`

> On getting this to people. It's a web build, so it's a URL — anyone with the link is in, no app store, no TestFlight, no invite list.
>
> It's configured as an installable app, so "add to home screen" gives you an icon, a splash screen, and no browser chrome. For a tester it's indistinguishable from a native app. `[tap it open]`
>
> App Store and Play Store are a packaging step later, not a rebuild. Same code.

---

## 6. Where it actually stands — be straight about this (60 seconds)

**Do not skip this section. Volunteering the gaps is what makes the rest credible.**

> Let me be honest about what's finished and what isn't.
>
> **Working end to end:** onboarding, the four-activity home, milestones, vaccinations, parent mode, and the whole data layer. Real accounts, real database, verified.
>
> **Scaffolded, not built:** the Copilot — the conversational layer — is navigation and structure with no model behind it yet. Same for the community section. They're routed and designed, not functional.
>
> **Needs outside input, not more code:**
> - The vaccination schedule is transcribed accurately from UIP and IAP sources, but it needs a paediatrician to sign it off before anyone relies on it. That's a clinical review, and I'm not qualified to be the last set of eyes on it.
> - Milestone coverage thins out after age five.
> - There are two activities per domain per age band. That's enough to demo and not enough to live with — the content library is the next real body of work.
>
> **One thing I'd fix before real users:** we ask how you gave birth without knowing whether you're the birthing parent. For an adoptive parent or a father that question is wrong on its face. The fix is small — ask the relationship in onboarding — but it's a good example of the kind of thing you only catch by reading your own product back slowly.

---

## 7. Close (30 seconds)

> So: a live website taking signups, an app you can put on your phone right now, and a database underneath it built to hold real families rather than a demo.
>
> The next stretch is content — filling the activity library out to something a parent can live in for a year — and then the Copilot, which is where this stops being a schedule and starts being a companion.
>
> Happy to take questions, and if anyone wants the link on their phone I'll send it now.

---

## Q&A — prepared answers

**"How is this different from BabyCenter / What to Expect?"**
> Those are content libraries — search-and-read, and the work is on you. This tells you four things to do today and gets out of the way. Also, they're about the child only. We have a whole second mode for the parent.

**"Where does the content come from?"**
> Activities and milestones are written against standard developmental frameworks and organised into seven age bands. The vaccination schedule is transcribed from the government UIP schedule and the IAP schedule. All of it is in version control. And all of it needs expert review before launch — I'd say that plainly to a user too.

**"Is this medical advice?"**
> No, and it shouldn't present as it. It's developmental play guidance plus a vaccination reference. The vaccination section in particular needs a clinician's sign-off and a clear disclaimer before launch. That's on the list.

**"What about privacy? This is children's data."**
> Every row is scoped to the owning family at the database level, not in app code. That said — a real children's-data product needs a privacy policy, a data-deletion path, and a look at what applies in our jurisdiction. That's a launch requirement I haven't done yet.

**"How long did this take?"**
> `[your honest number]` — fifteen commits on the app, a hundred and thirty on the website. The website went through four full design directions before it settled.

**"Why web instead of native?"**
> Distribution. Sending a link beats a TestFlight invite for getting real feedback fast. It's built in React Native via Expo, so the same code compiles to real iOS and Android builds when we want them — that's a packaging step, not a rewrite.

**"What's the business model?"**
> `[Answer honestly — if it's undecided, say so.]` Not decided. There's a product guide section that's an obvious affiliate surface, and the parent-care side is the kind of thing people pay for. But I've been building the thing before pricing the thing.

**"Can I try it?"**
> Yes — right now. `[send the link]`

---

## Delivery notes

- **Your two strongest moments are the four-domain Home and Parent Mode.** Everything else is supporting material. If you're running long, cut the infrastructure section, not those two.
- **Demo the phone, don't just describe it.** Physically opening the app from your home screen is worth more than any slide.
- **Section 6 is your credibility.** People trust a builder who names their own gaps more than one who presents a finished-looking thing.
- **Don't apologise for the scaffolded parts.** "Routed and designed, not functional" is a status, not a confession.
- If you blank: the thread is **one question a day → four activities → and the parent matters too.** Everything hangs off that.
