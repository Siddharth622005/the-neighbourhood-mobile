# End of internship talk — what to say

**10 slides. About 20 minutes of talking, plus the demo. 30 minute slot.**
Deck: `docs/presentation-deck.html` — arrow keys to move, `S` for notes,
click the clock to start timing.

---

## Two things to do before you present

1. **Add four phone screenshots to slide 5** — Home, Child, You, Ask.
   Take them on your phone and drop them in. Right now they're empty boxes
   with red dashed borders.
2. **Add photos of Yati, Muskan and Tejas** to slides 7, 8 and 9. Same
   thing — red dashed boxes waiting.

Everything else is done.

---

## Slide 1 — Six weeks

Just say the dates and move on.

> I spent six weeks building two things for The Neighbourhood. A website
> and an app. Here's how they came out.

---

## Slide 2 — What we're building

> The app tells you four things to do with your child today. One for
> moving, one for talking, one for thinking, one for feelings.
>
> Four cards, a few minutes each. You do them, you tick them off, you're
> done for the day. That's the whole idea.

---

## Slide 3 — The website, week by week ⭐

**These are real builds of the site from those dates. Not mockups. Walk
left to right and point at what changed.**

> This is the same page four times, six weeks apart.
>
> First one, 12th of July. Grey-brown, handprints, text on the left.
>
> Second, ten days later. I rebuilt the layout. More space, softer shapes.
>
> Third, 2nd of August. New colours — cream and terracotta — and the text
> moved to the middle.
>
> And that's it live today. Serif headline, one word in orange.
>
> Same sentence the whole way through. It took four goes to find the right
> way to say it. At one point I had four versions running at once, so I
> picked one and deleted the other three.

---

## Slide 4 — The app starts with four questions

> The app opens with four questions. Your name, your child's name, their
> birthday, their gender.
>
> One question per screen, not a long form. Takes under a minute.
>
> The birthday one matters most. Every activity you get, every discovery,
> every vaccination date is worked out from that one date. So it gets its
> own screen and a proper picker.

---

## Slide 5 — Then it gets to work 📱 DEMO

**Put the slides down and pick up the phone. Open it from your home
screen — that's better than any slide.**

Order: **Home** → **Child** → **You** → **Ask**. About a minute each.

- **Home** — tap into an activity, finish it, show the ring fill up.
  *"Four out of four is a day you can actually finish. An app you fail
  every day is an app you delete."*
- **Child** — Discoveries, then Vaccinations.
  *"The vaccine list is split three ways: what the government gives free,
  what the paediatric association adds, and what depends on where you
  live. Most lists just show you twenty vaccines and you can't tell
  what's essential."*
- **You** — let the colour change happen before you talk.
  *"This is the bit I'm proudest of. Every other parenting app is about
  the child. But the parent is recovering too and nobody asks how they
  are. So they get their own half."*
- **Ask** — type a real question, wait for the answer.

**Don't talk over a loading screen.** If it breaks, use the pictures on
the slide and keep going. Don't debug in front of people.

---

## Slide 6 — What's in it, and what isn't

**Don't read the numbers out one by one. Say the headline, then go
straight to the right-hand column.**

> There's about a thousand activities in there now, covering birth to
> seven years, and a proper database behind it.
>
> Being straight about the rest: the daily four, discoveries,
> vaccinations, the parent side, the AI and community all work with real
> accounts and real data.
>
> Reports and the two guides are built and clickable but the content isn't
> written yet.
>
> The vaccination list needs a paediatrician to check it before anyone
> relies on it. I copied it carefully from the official schedules, but I'm
> not the right person to be the last check on medical information.
>
> And there's no analytics yet, so I honestly can't tell you whether
> anyone comes back on day two. The waitlist has eleven sign-ups. It's not
> a pipeline yet.

**Say the eleven out loud.** Hiding it would undo the honesty.

---

## Slides 7, 8, 9 — The other three interns

**Change your tone here. You're done with your own work. Slow down, look
at the room instead of the screen. If they're in the room, look at them.**

> Before I finish — I wasn't the only one here this summer.

### Yati

> We call Yati aggressive. We mean it as a compliment.
>
> All of us are a little bit scared of her. Also a compliment.
>
> But if a job is hers, it's done, and it's done properly. She never needs
> chasing. *Best approached with your work already finished.*

### Muskan

> Muskan is brutally honest about everything. You always know exactly
> where you stand with her.
>
> Head down, gets on with it, never makes noise about any of it.
>
> She gets ill sometimes. And once, she sent Rachit her actual medical
> reports as proof. `[pause]` Nobody had asked for proof.
>
> *Most of us text "not well today." Muskan submits evidence.*

### Tejas

> Tejas plays table tennis at national level. Do not agree to a friendly
> game, you will lose.
>
> He's also the founder's nephew. Yes, we've all made the joke already.
>
> And he still works as hard as anyone here, which he didn't have to.

**Say the nephew line lightly and get straight to the last line. End
warm — this is the last thing before you close.**

---

## Slide 10 — That's it

> So: a website that's live, and an app you can put on your phone right
> now. It's just a link — no app store, no invites.
>
> Happy to send it to anyone who wants it. Thank you.

Then stop talking and take questions.

---

## If someone asks

**How's it different from BabyCenter or What to Expect?**
> Those are big libraries of articles. You have to go looking, and you
> have to already know what your problem is called. This just tells you
> four things to do today. And they're only about the child — we have a
> whole side for the parent.

**Where does the content come from?**
> Written against standard child development frameworks. The vaccination
> list is copied from the government schedule and the paediatric
> association schedule. All of it needs an expert to check it before
> launch, and I'd say that to a parent too.

**Is this medical advice?**
> No. It's play ideas and a vaccination reference. The vaccination part
> needs a doctor to sign it off and a clear disclaimer before launch.

**What about privacy? It's children's data.**
> Every row in the database is locked to the family that owns it, and
> that's enforced by the database, not by my code. There are privacy and
> terms pages up. It still needs a delete-my-data path before launch.

**Why a web app and not on the app store?**
> So I could send people a link and get feedback the same day. It's built
> with React Native, so putting it on the app store later is a packaging
> step, not a rewrite.

**How long did it take?**
> Six weeks. 11th of July to yesterday. Eighty commits.

**Only eleven sign-ups?**
> Yes. I've been building it, not promoting it. That's the next job.

**Can I try it?** → send the link.

---

## If you forget everything else

Four things to do today → the parent matters too → here's what's real and
what isn't → and here are the three people I worked with.
