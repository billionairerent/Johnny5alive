import type { KeywordAlignment } from "@/types/documents";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface Props {
  alignment: KeywordAlignment;
}

export function KeywordPanel({ alignment }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Keyword Alignment
          </h3>
          <span className="text-xs font-medium text-gray-600">
            {alignment.coverage}% coverage
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-1.5 rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${alignment.coverage}%` }}
          />
        </div>

        {alignment.matched.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Matched ({alignment.matched.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {alignment.matched.map((k) => (
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

        {alignment.addressable.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-amber-500" />
              Addressable — add to skills list ({alignment.addressable.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {alignment.addressable.map((k) => (
                <span
                  key={k}
                  className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {alignment.missing.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              Missing ({alignment.missing.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {alignment.missing.map((k) => (
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
  );
}
