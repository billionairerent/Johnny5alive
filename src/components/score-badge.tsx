import { clsx } from "clsx";

interface ScoreBadgeProps {
  score: number;
  recommendation: "strong_apply" | "apply_with_edits" | "skip";
  size?: "sm" | "md" | "lg";
}

const LABELS: Record<string, string> = {
  strong_apply: "Strong Apply",
  apply_with_edits: "Apply with Edits",
  skip: "Skip",
};

export function ScoreBadge({ score, recommendation, size = "md" }: ScoreBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={clsx(
          "flex items-center justify-center rounded-full font-bold",
          {
            "h-10 w-10 text-sm": size === "sm",
            "h-14 w-14 text-lg": size === "md",
            "h-20 w-20 text-2xl": size === "lg",
          },
          recommendation === "strong_apply" && "bg-emerald-100 text-emerald-700",
          recommendation === "apply_with_edits" && "bg-amber-100 text-amber-700",
          recommendation === "skip" && "bg-red-100 text-red-700"
        )}
      >
        {score}
      </div>
      <span
        className={clsx(
          "rounded-full px-3 py-1 text-xs font-semibold",
          recommendation === "strong_apply" && "bg-emerald-50 text-emerald-700",
          recommendation === "apply_with_edits" && "bg-amber-50 text-amber-700",
          recommendation === "skip" && "bg-red-50 text-red-700"
        )}
      >
        {LABELS[recommendation]}
      </span>
    </div>
  );
}
