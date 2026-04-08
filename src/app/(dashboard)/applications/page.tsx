import { Card, CardContent } from "@/components/ui/card";

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track every application from submission to offer.
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-gray-500">
            No applications tracked yet. Apply to a job to see it here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
