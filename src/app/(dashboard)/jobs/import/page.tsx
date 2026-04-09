"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { importAndScoreJob, type ImportResult } from "@/lib/jobs/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScoreCard } from "@/components/score-card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function JobImportPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in.");
      setLoading(false);
      return;
    }

    const res = await importAndScoreJob(
      {
        raw_text: rawText,
        company_name: companyName || undefined,
        job_title: jobTitle || undefined,
        source_url: sourceUrl || undefined,
      },
      supabase,
      user.id
    );

    setLoading(false);

    if (!res.success) {
      setError(res.error || "Import failed.");
      return;
    }

    setResult(res);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/jobs" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import a Job</h1>
          <p className="mt-1 text-sm text-gray-600">
            Paste a job description to analyze fit and get a recommendation.
          </p>
        </div>
      </div>

      {!result ? (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Company name"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <Input
                  label="Job title"
                  placeholder="Senior Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <Input
                label="Job URL (optional)"
                placeholder="https://..."
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Job description <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors min-h-[200px] resize-y"
                  placeholder="Paste the full job description here..."
                  required
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  {rawText.length} characters
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading || !rawText.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Import & Score"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Job summary */}
          <Card>
            <CardHeader>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {result.extracted?.job_title || jobTitle || "Imported Job"}
                </h2>
                <p className="text-sm text-gray-600">
                  {result.extracted?.company_name || companyName || "Company"}{" "}
                  {result.extracted?.location && `· ${result.extracted.location}`}
                  {result.extracted?.remote_type && ` · ${result.extracted.remote_type}`}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {result.extracted?.employment_type && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {result.extracted.employment_type}
                  </span>
                )}
                {result.extracted?.experience_level && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {result.extracted.experience_level}
                  </span>
                )}
                {result.extracted?.salary_min && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {result.extracted.salary_currency}{" "}
                    {result.extracted.salary_min.toLocaleString()}
                    {result.extracted.salary_max &&
                      ` – ${result.extracted.salary_max.toLocaleString()}`}
                  </span>
                )}
                {result.extracted?.years_experience && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {result.extracted.years_experience}+ years
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Score */}
          {result.score && <ScoreCard score={result.score} />}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setResult(null);
                setRawText("");
                setCompanyName("");
                setJobTitle("");
                setSourceUrl("");
                setError(null);
              }}
            >
              Import Another
            </Button>
            <Button onClick={() => router.push("/jobs")}>
              View All Jobs
            </Button>
            {result.jobId && (
              <Button
                variant="ghost"
                onClick={() => router.push(`/jobs/${result.jobId}`)}
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
