import { SectionScaffold } from "../../../components/SectionScaffold";

/**
 * Milestones — library + upcoming + mark achieved. Two taps from Home.
 *
 * Tapping a specific milestone for detail is the one place the IA allows
 * a third tap; that detail route is not scaffolded yet.
 *
 * Age filters content, never structure: milestone density thins out for
 * older children, but this screen exists identically at every age.
 */
export default function Milestones() {
  return (
    <SectionScaffold
      eyebrow="MILESTONES"
      title="What's typical, what's next, what's already theirs."
      body="Milestones for their exact age — the ones coming up, and the ones you've already marked. Never a percentile or a comparison to another child."
      needs={[
        "A milestones table + per-child achieved records in Supabase",
        "The 15-stage age-band milestone dataset ported from the website",
        "Mark-achieved write path, so completions feed the child's profile",
      ]}
    />
  );
}
