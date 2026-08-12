-- Starter content for Community, carried over from the old in-memory
-- lib/db/communityMockData.ts so the tab is not empty on first open.
--
-- These rows have author_id = null, which is how the app tells seeded
-- content apart from a real parent's post. Bodies use dollar quoting so
-- the apostrophes in the prose need no escaping.
--
-- Verified expert replies: only the two from doctors are flagged
-- is_verified. The nutritionist and the development specialist are not,
-- so the badge stays a real distinction rather than decoration.
insert into
  community_discussions (
    id, author_id, author_initial, author_child_age_months, topic,
    title, body, age_relevance_min, age_relevance_max, created_at
  )
values
  (
    'c0000000-0000-4000-8000-000000000001', null, 'S', 14, 'sleep',
    $t$14-month-old suddenly fighting afternoon naps$t$,
    $t$My toddler was napping consistently for 1.5 hours every afternoon. Over the past week, she screams the moment she's placed in her crib. Is this the 14-month sleep regression or is she trying to drop to one nap?$t$,
    10, 20, now() - interval '3 hours'
  ),
  (
    'c0000000-0000-4000-8000-000000000002', null, 'M', 8, 'feeding',
    $t$Weaning tips and texture refusal at 8 months$t$,
    $t$We started finger foods two weeks ago, but he gags and spits out anything chunkier than smooth puree. How did you transition your baby to mashed/lumpy textures without panicking?$t$,
    6, 12, now() - interval '6 hours'
  ),
  (
    'c0000000-0000-4000-8000-000000000003', null, 'K', 13, 'milestones',
    $t$When did your little one start pointing to show interest?$t$,
    $t$She points to things she wants (imperative pointing), but hasn't started pointing just to show me things she finds interesting (declarative pointing) at 13 months. Should I practice this with her daily?$t$,
    10, 18, now() - interval '1 day'
  ),
  (
    'c0000000-0000-4000-8000-000000000004', null, 'A', 18, 'behaviour',
    $t$Handling big tantrums during diaper changes$t$,
    $t$Every single diaper change has turned into a wrestling match at 18 months. She arches her back and screams. What gentle distractor games or routines worked for your family?$t$,
    12, 30, now() - interval '4 hours'
  ),
  (
    'c0000000-0000-4000-8000-000000000005', null, 'R', 6, 'health',
    $t$Post-vaccination low fever and fussiness at 6 months$t$,
    $t$Got 6-month shots yesterday morning. Temperature is around 99.8F and baby is extra clingy. How long did the post-vax tiredness last for your little ones?$t$,
    4, 8, now() - interval '14 hours'
  ),
  (
    'c0000000-0000-4000-8000-000000000006', null, 'D', 25, 'play',
    $t$Simple indoor activities for rainy days with a 2-year-old$t$,
    $t$Looking for low-prep activities that don't involve screen time. We've done sensory bins with rice and water play. What are your favorite quick ideas?$t$,
    18, 36, now() - interval '1 day'
  ),
  (
    'c0000000-0000-4000-8000-000000000007', null, 'N', 22, 'development',
    $t$Language explosion at 22 months, repeating everything!$t$,
    $t$Suddenly over the last 2 weeks, he went from 20 words to mimicking entire 3-word sentences. Anyone else amazed by how quickly their comprehension expands around this stage?$t$,
    18, 30, now() - interval '2 days'
  ),
  (
    'c0000000-0000-4000-8000-000000000008', null, 'J', 1, 'sleep',
    $t$Newborn day/night confusion at 3 weeks old$t$,
    $t$Our baby sleeps peacefully all day long from 9am to 6pm, then stays wide awake and alert from midnight to 4am. How long until their circadian rhythm settles?$t$,
    0, 3, now() - interval '2 days'
  )
on conflict (id) do update
set
  topic = excluded.topic,
  title = excluded.title,
  body = excluded.body,
  age_relevance_min = excluded.age_relevance_min,
  age_relevance_max = excluded.age_relevance_max;

insert into
  community_replies (
    id, discussion_id, author_id, author_initial, author_child_age_months,
    body, is_expert, expert_name, credential, is_verified, created_at
  )
values
  -- Expert replies.
  (
    'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
    null, 'P', 0,
    $t$Sleep shifts around 12-15 months are very common and often coincide with motor development leaps (like walking or climbing). Before dropping to a single nap, test keeping wake windows 15-20 minutes longer in the morning. Most toddlers aren't fully ready for one nap until 15-18 months.$t$,
    true, 'Dr. Priya Sharma', 'Pediatrician', true, now() - interval '2 hours'
  ),
  (
    'e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002',
    null, 'A', 0,
    $t$Gagging is a protective reflex located near the front of the tongue at this stage. It is completely normal and differs from choking! Try offering soft resistive foods like cooked carrot sticks or avocado spears that he can hold and explore at his own pace.$t$,
    true, 'Ananya Roy', 'Pediatric Nutritionist', false, now() - interval '5 hours'
  ),
  (
    'e0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003',
    null, 'R', 0,
    $t$Declarative pointing typically emerges between 12 and 16 months. You can model this by pointing during outdoor walks while saying 'Look, a doggie!' with enthusiastic facial expressions. No stress required!$t$,
    true, 'Rohan Mehta', 'Child Development Specialist', false, now() - interval '1 day'
  ),
  (
    'e0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005',
    null, 'P', 0,
    $t$Mild low-grade fever and fussiness for 24-48 hours after routine vaccinations are standard signs of the immune system building antibodies. Keep baby hydrated with extra nursing/formula feeds and skin-to-skin contact.$t$,
    true, 'Dr. Priya Sharma', 'Pediatrician', true, now() - interval '12 hours'
  ),
  (
    'e0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000008',
    null, 'K', 0,
    $t$Circadian rhythms start producing melatonin naturally around 8-12 weeks. Right now, expose your baby to bright indirect sunlight during daytime feeds, and keep nighttime feeds pitch dark with low whispering.$t$,
    true, 'Dr. Kavita Nambiar', 'Infant Sleep Consultant', true, now() - interval '1 day'
  ),
  -- Parent replies.
  (
    'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
    null, 'P', 15,
    $t$We went through the exact same thing at 14 months! It lasted about 10 days. We stuck strictly to bedtime routines and didn't drop the nap yet. She went back to normal soon after.$t$,
    false, null, null, false, now() - interval '2 hours'
  ),
  (
    'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001',
    null, 'L', 13,
    $t$What worked for us was shifting lunch 15 minutes earlier and giving her a quiet book in crib for 10 minutes before soothing. Hang in there!$t$,
    false, null, null, false, now() - interval '1 hour'
  ),
  (
    'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002',
    null, 'T', 9,
    $t$Steamed sweet potato sticks were our lifesaver! They're super soft so even if baby bites off a chunk, it squishes instantly.$t$,
    false, null, null, false, now() - interval '4 hours'
  ),
  (
    'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004',
    null, 'E', 19,
    $t$We give our toddler a special 'diaper-only toy' (a small flashlight or musical shaker) that he ONLY gets to hold during changes. Works 90% of the time!$t$,
    false, null, null, false, now() - interval '3 hours'
  ),
  (
    'a0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000004',
    null, 'V', 17,
    $t$Standing diaper changes for wet diapers helped us tremendously! Pant-style diapers make this super easy.$t$,
    false, null, null, false, now() - interval '2 hours'
  )
on conflict (id) do update
set
  body = excluded.body,
  is_expert = excluded.is_expert,
  expert_name = excluded.expert_name,
  credential = excluded.credential,
  is_verified = excluded.is_verified;
