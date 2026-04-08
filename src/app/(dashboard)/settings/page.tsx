"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  portfolio_url: string;
  headline: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    linkedin_url: "",
    portfolio_url: "",
    headline: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name ?? "",
          email: data.email,
          phone: data.phone ?? "",
          location: data.location ?? "",
          linkedin_url: data.linkedin_url ?? "",
          portfolio_url: data.portfolio_url ?? "",
          headline: data.headline ?? "",
        });
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        location: profile.location,
        linkedin_url: profile.linkedin_url,
        portfolio_url: profile.portfolio_url,
        headline: profile.headline,
      })
      .eq("id", user.id);

    setSaving(false);
    setMessage(error ? error.message : "Profile saved.");
  }

  function update(field: keyof Profile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your profile and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Full name"
              value={profile.full_name}
              onChange={(e) => update("full_name", e.target.value)}
            />
            <Input label="Email" value={profile.email} disabled />
            <Input
              label="Phone"
              value={profile.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+1 555-0100"
            />
            <Input
              label="Location"
              value={profile.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="San Francisco, CA"
            />
            <Input
              label="Headline"
              value={profile.headline}
              onChange={(e) => update("headline", e.target.value)}
              placeholder="Senior Software Engineer"
            />
            <Input
              label="LinkedIn URL"
              value={profile.linkedin_url}
              onChange={(e) => update("linkedin_url", e.target.value)}
              placeholder="https://linkedin.com/in/janedoe"
            />
            <Input
              label="Portfolio URL"
              value={profile.portfolio_url}
              onChange={(e) => update("portfolio_url", e.target.value)}
              placeholder="https://janedoe.com"
            />

            {message && (
              <p
                className={`text-sm rounded-lg px-3 py-2 ${
                  message.includes("saved")
                    ? "text-green-700 bg-green-50"
                    : "text-red-600 bg-red-50"
                }`}
              >
                {message}
              </p>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
