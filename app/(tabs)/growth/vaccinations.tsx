import { SectionScaffold } from "../../../components/SectionScaffold";

/**
 * Vaccinations — schedule, history, record a vaccination.
 *
 * This is also the source of the one contextual nudge Home is allowed to
 * show ("due this week"). The nudge lives on Home; the records live here.
 * Nudges taper off naturally as the schedule thins with age — that's
 * content thinning out, not the section disappearing.
 */
export default function Vaccinations() {
  return (
    <SectionScaffold
      eyebrow="VACCINATIONS"
      title="What's due, and what's done."
      body="The IAP schedule mapped to their date of birth, what you've already recorded, and what's coming up. Record one in a tap when you get back from the clinic."
      needs={[
        "A vaccinations schedule dataset (IAP) + per-child given records",
        "Due-date computation from date_of_birth",
        "The Home nudge reading 'due this week' from this same source",
      ]}
    />
  );
}
