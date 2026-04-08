import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  FileText,
  Search,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react";

async function getStats(userId: string) {
  const supabase = await createClient();

  const [resumes, jobs, applications] = await Promise.all([
    supabase
      .from("resumes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    resumes: resumes.count ?? 0,
    jobs: jobs.count ?? 0,
    applications: applications.count ?? 0,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stats = user ? await getStats(user.id) : { resumes: 0, jobs: 0, applications: 0 };

  const cards = [
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Your job search at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
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

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Needs Review
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              No items need your review right now.
            </p>
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
