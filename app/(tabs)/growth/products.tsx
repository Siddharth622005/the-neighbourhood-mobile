import { SectionScaffold } from "../../../components/SectionScaffold";

/**
 * Curated product guide — a section inside Growth, never a tab, and never
 * on Home. Home is for what to do today; recommendations are something a
 * parent goes looking for, not something we push into the daily view.
 */
export default function Products() {
  return (
    <SectionScaffold
      eyebrow="PRODUCT GUIDE"
      title="A short list, not a catalogue."
      body="A few things genuinely worth having at their age, and why. Deliberately small — if everything is recommended, nothing is."
      needs={[
        "A curated products dataset with age bands and an honest rationale per item",
        "A disclosure position on affiliate/commercial relationships",
        "A product detail route (the allowed third tap)",
      ]}
    />
  );
}
