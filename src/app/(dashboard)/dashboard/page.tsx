"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/score-badge";
import {
  FileText,
  Search,
  ClipboardList,
  TrendingUp,
  Plus,
  Clock,
} from "lucide-react";

interface Stats {
  resumes: number;
  jobs: number;
  applications: number;
}

interface RecentJob {
  id: string;
  title: string;
  company: string;
  created_at: string;
}

interface ScoreRow {
  job_id: string;
  fit_score: number;
  recommendation: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    resumes: 0,
    jobs: 0,
    applications: 0,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [scores, setScores] = useState<Map<string, ScoreRow>>(new Map());

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [resumes, jobs, applications] = await Promise.all([
        supabase
          .from("resumes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      setStats({
        resumes: resumes.count ?? 0,
        jobs: jobs.count ?? 0,
        applications: applications.count ?? 0,
      });

      // Load recent jobs
      const { data: jobData } = await supabase
        .from("jobs")
        .select("id, title, company, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (jobData) setRecentJobs(jobData.slice(0, 5));

      // Load scores
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

  const statCards = [
    {
      label: "Resumes",
      value: stats.resumes,
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Jobs Imported",
      value: stats.jobs,
      icon: Search,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Applications",
      value: stats.applications,
      icon: ClipboardList,
      color: "text-violet-600 bg-violet-50",
    },
    {
      label: "Response Rate",
      value: "—",
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Your job search at a glance.
          </p>
        </div>
        <Link href="/jobs/import">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Import Job
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent jobs + Follow-ups */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-emerald-500" />
                Recent Jobs
              </h2>
              {recentJobs.length > 0 && (
                <Link
                  href="/jobs"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  View all
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">No jobs imported yet.</p>
                <Link href="/jobs/import">
                  <Button size="sm" variant="secondary">
                    Import your first job
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => {
                  const score = scores.get(job.id);
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {job.title}
                        </p>
                        <p className="text-xs text-gray-500">{job.company}</p>
                      </div>
                      {score && (
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
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Upcoming Follow-ups
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              No follow-ups scheduled yet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
