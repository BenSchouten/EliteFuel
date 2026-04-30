import { Panel, PageHeader } from "@/components/ui";

export default function SafetyPage() {
  return (
    <>
      <PageHeader title="Safety" eyebrow="Youth-safe nutrition support" />
      <div className="grid gap-5 md:grid-cols-2">
        <Panel>
          <h2 className="text-xl font-semibold">Product boundaries</h2>
          <p className="mt-3 text-stone-700">EliteFuel supports practical nutrition operations for clubs. It does not diagnose, prescribe clinical diets, or replace medical care.</p>
        </Panel>
        <Panel>
          <h2 className="text-xl font-semibold">Meal photo handling</h2>
          <p className="mt-3 text-stone-700">Meal images are used transiently for broad interpretation only. The app saves the extracted meal description and discards the image.</p>
        </Panel>
        <Panel>
          <h2 className="text-xl font-semibold">No public social feed</h2>
          <p className="mt-3 text-stone-700">The club meal library is club-scoped and operational. There are no comments, likes, followers, reactions, or worldwide posting.</p>
        </Panel>
        <Panel>
          <h2 className="text-xl font-semibold">Performance-focused language</h2>
          <p className="mt-3 text-stone-700">Meal feedback focuses on training readiness, recovery, and practical improvements, not moral judgments about food.</p>
        </Panel>
      </div>
    </>
  );
}
