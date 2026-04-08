"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Start automating your job search
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              name="full_name"
              type="text"
              required
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              required
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
