import type { FitScore } from "@/types/jobs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScoreBadge } from "@/components/score-badge";
import { CheckCircle2, XCircle, BarChart3 } from "lucide-react";

interface ScoreCardProps {
  score: FitScore;
  compact?: boolean;
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full bg-brand-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreCard({ score, compact = false }: ScoreCardProps) {
  if (compact) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between">
          <ScoreBadge
            score={score.overall_score}
            recommendation={score.recommendation}
            size="sm"
          />
          <span className="text-xs text-gray-500">
            {score.confidence}% confidence
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score header */}
      <Card>
        <CardContent className="flex items-center justify-between">
          <ScoreBadge
            score={score.overall_score}
            recommendation={score.recommendation}
            size="lg"
          />
          <span className="text-sm text-gray-500">
            {score.confidence}% confidence
          </span>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-500" />
            Score Breakdown
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <BreakdownBar label="Title Alignment" value={score.breakdown.title_alignment} />
          <BreakdownBar label="Skill Overlap" value={score.breakdown.skill_overlap} />
          <BreakdownBar label="Experience" value={score.breakdown.experience_overlap} />
          <BreakdownBar label="Education" value={score.breakdown.education_match} />
          <BreakdownBar label="Keywords" value={score.breakdown.keyword_relevance} />
        </CardContent>
      </Card>

      {/* Strengths & Gaps */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {score.strengths.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {score.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-emerald-500 mt-0.5">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {score.gaps.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Gaps
              </h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {score.gaps.map((g, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-red-500 mt-0.5">-</span>
                    {g}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Keywords */}
      {(score.matched_keywords.length > 0 || score.missing_keywords.length > 0) && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">Keywords</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {score.matched_keywords.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Matched</p>
                <div className="flex flex-wrap gap-1.5">
                  {score.matched_keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {score.missing_keywords.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Missing</p>
                <div className="flex flex-wrap gap-1.5">
                  {score.missing_keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {score.notes && (
        <p className="text-xs text-gray-500 italic">{score.notes}</p>
      )}
    </div>
  );
}
