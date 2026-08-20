import { SectionScaffold } from "../../../components/SectionScaffold";

/**
 * Development reports — weekly and monthly summaries.
 *
 * Opening a specific report is the second place the IA allows a third
 * tap (list → report). That detail route is not scaffolded yet.
 *
 * Reports are generated from real usage only; with no history there is
 * nothing to summarise, and this screen should say so rather than
 * produce a report about nothing.
 */
export default function Reports() {
  return (
    <SectionScaffold
      eyebrow="REPORTS"
      title="How the last few weeks actually went."
      body="Quiet summaries of what you did together and what shifted. Written for you, not for comparison. They start appearing once there's enough of a pattern to be honest about."
      needs={[
        "An activity/interaction log to summarise (nothing persists server-side yet)",
        "Report generation + storage, weekly and monthly cadence",
        "A report detail route (the allowed third tap)",
      ]}
    />
  );
}
