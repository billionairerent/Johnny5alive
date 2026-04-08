import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Import jobs and see how well they fit your profile.
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Import Job
        </Button>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-gray-500">
            No jobs imported yet. Paste a job description or URL to get started.
          </p>
          <Link
            href="#"
            className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Import your first job
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
