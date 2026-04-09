"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScoreCard } from "@/components/score-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, MapPin, Briefcase, Calendar } from "lucide-react";
import Link from "next/link";
import type { FitScore, ExtractedJob } from "@/types/jobs";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  work_mode: string | null;
  description: string | null;
  requirements: ExtractedJob | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  source_url: string | null;
  status: string;
  created_at: string;
}

interface ScoreRow {
  fit_score: number;
  strengths: string[];
  gaps: string[];
  risk_flags: string[];
  recommendation: string;
  explanation: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [scoreRow, setScoreRow] = useState<ScoreRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: jobData } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobData) setJob(jobData as Job);

      const { data: scoreData } = await supabase
        .from("job_scores")
        .select("*")
        .eq("job_id", jobId)
        .single();

      if (scoreData) setScoreRow(scoreData as ScoreRow);
      setLoading(false);
    }
    load();
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <Link href="/jobs" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>
        <p className="text-gray-500">Job not found.</p>
      </div>
    );
  }

  const extracted = job.requirements;

  // Reconstruct a FitScore from the database row for display
  const fitScore: FitScore | null = scoreRow
    ? {
        overall_score: scoreRow.fit_score,
        recommendation: scoreRow.recommendation as FitScore["recommendation"],
        strengths: scoreRow.strengths || [],
        gaps: scoreRow.gaps || [],
        matched_keywords: [],
        missing_keywords: scoreRow.risk_flags || [],
        breakdown: {
          title_alignment: 0,
          skill_overlap: 0,
          experience_overlap: 0,
          education_match: 0,
          keyword_relevance: 0,
        },
        confidence: 0,
        notes: scoreRow.explanation || "",
      }
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/jobs" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      {/* Job header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-sm text-gray-600 mt-1">{job.company}</p>
            </div>
            {job.source_url && (
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:text-brand-700"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {job.location}
              </span>
            )}
            {job.work_mode && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" /> {job.work_mode}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />{" "}
              {new Date(job.created_at).toLocaleDateString()}
            </span>
            {job.salary_min && (
              <span className="rounded-full bg-gray-100 px-3 py-0.5">
                {job.salary_currency} {job.salary_min.toLocaleString()}
                {job.salary_max && ` – ${job.salary_max.toLocaleString()}`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extracted skills */}
      {extracted && extracted.required_skills.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">
              Required Skills
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {extracted.required_skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                >
                  {s}
                </span>
              ))}
            </div>
            {extracted.preferred_skills.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1.5">Nice to have</p>
                <div className="flex flex-wrap gap-1.5">
                  {extracted.preferred_skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Score */}
      {fitScore && <ScoreCard score={fitScore} />}

      {/* Raw description (collapsed) */}
      {job.description && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">
              Full Description
            </h2>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed max-h-96 overflow-y-auto">
              {job.description}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
