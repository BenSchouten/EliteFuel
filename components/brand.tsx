import { FlameKindling } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-2 font-semibold text-fuel-ink">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-fuel-green text-white">
        <FlameKindling size={20} aria-hidden />
      </span>
      <span>EliteFuel</span>
    </div>
  );
}
