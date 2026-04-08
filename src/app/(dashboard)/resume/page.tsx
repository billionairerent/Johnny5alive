"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ACCEPTED_RESUME_TYPES,
  MAX_RESUME_SIZE_BYTES,
  MAX_RESUME_SIZE_MB,
} from "@/lib/constants";
import { Upload, FileText, Trash2, Star } from "lucide-react";

interface Resume {
  id: string;
  name: string;
  is_master: boolean;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const loadResumes = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("resumes")
      .select("id, name, is_master, file_type, file_size, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setResumes(data);
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  async function uploadFile(file: File) {
    setError(null);

    if (!ACCEPTED_RESUME_TYPES.includes(file.type)) {
      setError("Please upload a PDF or Word document.");
      return;
    }
    if (file.size > MAX_RESUME_SIZE_BYTES) {
      setError(`File must be under ${MAX_RESUME_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);

    // In demo mode, persist directly via the client-side demo store.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const existingResumes = await supabase
        .from("resumes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      const isMaster = (existingResumes.count ?? 0) === 0;

      await supabase.from("resumes").insert({
        user_id: user.id,
        name: file.name,
        is_master: isMaster,
        file_path: `uploads/${file.name}`,
        file_type: file.type,
        file_size: file.size,
      });
    }

    setUploading(false);
    loadResumes();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  async function handleDelete(resumeId: string) {
    const supabase = createClient();
    await supabase.from("resumes").delete().eq("id", resumeId);
    loadResumes();
  }

  async function handleSetMaster(resumeId: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Clear existing master flag
    await supabase
      .from("resumes")
      .update({ is_master: false })
      .eq("user_id", user.id);

    // Set new master
    await supabase
      .from("resumes")
      .update({ is_master: true })
      .eq("id", resumeId);

    loadResumes();
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resume Vault</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload your master resume. We&apos;ll use it to tailor applications.
        </p>
      </div>

      {/* Upload zone */}
      <Card>
        <CardContent>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
              dragOver
                ? "border-brand-400 bg-brand-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Upload
              className={`h-8 w-8 mb-3 ${
                dragOver ? "text-brand-500" : "text-gray-400"
              }`}
            />
            <p className="text-sm font-medium text-gray-700">
              {uploading
                ? "Uploading..."
                : "Drop your resume here or click to browse"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF or Word, up to {MAX_RESUME_SIZE_MB}MB
            </p>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resume list */}
      {resumes.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Your Resumes
            </h2>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 p-0">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {resume.name}
                      {resume.is_master && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                          Master
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatSize(resume.file_size)} &middot;{" "}
                      {new Date(resume.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!resume.is_master && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetMaster(resume.id)}
                      title="Set as master resume"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(resume.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
