"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/score-badge";
import { Plus, MapPin, Calendar } from "lucide-react";

interface JobRow {
  id: string;
  title: string;
  company: string;
  location: string | null;
  work_mode: string | null;
  status: string;
  created_at: string;
}

interface ScoreRow {
  job_id: string;
  fit_score: number;
  recommendation: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [scores, setScores] = useState<Map<string, ScoreRow>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: jobData } = await supabase
        .from("jobs")
        .select("id, title, company, location, work_mode, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (jobData) setJobs(jobData);

      const { data: scoreData } = await supabase
        .from("job_scores")
        .select("job_id, fit_score, recommendation")
        .eq("user_id", user.id);

      if (scoreData) {
        const map = new Map<string, ScoreRow>();
        for (const s of scoreData) map.set(s.job_id, s as ScoreRow);
        setScores(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Import jobs and see how well they fit your profile.
          </p>
        </div>
        <Link href="/jobs/import">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Import Job
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-gray-500">
              No jobs imported yet. Paste a job description to get started.
            </p>
            <Link
              href="/jobs/import"
              className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Import your first job
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const score = scores.get(job.id);
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:border-brand-200 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-600">{job.company}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </span>
                        )}
                        {job.work_mode && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5">
                            {job.work_mode}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {score && (
                      <div className="ml-4 shrink-0">
                        <ScoreBadge
                          score={score.fit_score}
                          recommendation={
                            score.recommendation as
                              | "strong_apply"
                              | "apply_with_edits"
                              | "skip"
                          }
                          size="sm"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
