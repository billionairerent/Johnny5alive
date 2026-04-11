"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResumePreview } from "@/components/documents/resume-preview";
import { CoverLetterPreview } from "@/components/documents/cover-letter-preview";
import { KeywordPanel } from "@/components/documents/keyword-panel";
import {
  generateTailoredResume,
  generateTailoredCoverLetter,
  listJobDocuments,
  saveDocumentVersion,
} from "@/lib/documents/actions";
import type {
  TailoredDocumentRecord,
  TailoredResumeContent,
  CoverLetterContent,
} from "@/types/documents";
import { ArrowLeft, FileText, Mail, Sparkles, Check, Download } from "lucide-react";

type Tab = "resume" | "cover_letter";

export default function DocumentsPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [tab, setTab] = useState<Tab>("resume");
  const [documents, setDocuments] = useState<TailoredDocumentRecord[]>([]);
  const [activeDoc, setActiveDoc] = useState<TailoredDocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const docs = await listJobDocuments(supabase, user.id, jobId);
    setDocuments(docs);
    setLoading(false);
    // Auto-select the newest doc for the current tab
    const current = docs.find((d) => d.doc_type === tab);
    if (current) setActiveDoc(current);
  }, [jobId, tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate(docType: Tab) {
    setGenerating(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
      setGenerating(false);
      return;
    }

    const result =
      docType === "resume"
        ? await generateTailoredResume(supabase, user.id, jobId)
        : await generateTailoredCoverLetter(supabase, user.id, jobId);

    setGenerating(false);

    if (!result.success) {
      setError(result.error || "Generation failed.");
      return;
    }

    if (result.document) {
      setTab(docType);
      setActiveDoc(result.document);
      await load();
    }
  }

  async function handleSaveVersion() {
    if (!activeDoc) return;
    const supabase = createClient();
    await saveDocumentVersion(supabase, activeDoc.id);
    await load();
  }

  function handleExport() {
    if (!activeDoc) return;
    window.open(`/api/documents/${activeDoc.id}/export`, "_blank");
  }

  const resumeDocs = documents.filter((d) => d.doc_type === "resume");
  const coverLetterDocs = documents.filter((d) => d.doc_type === "cover_letter");
  const currentDocs = tab === "resume" ? resumeDocs : coverLetterDocs;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/jobs/${jobId}`}
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tailored Documents</h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate ATS-friendly resumes and cover letters grounded in your real experience.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setTab("resume");
            setActiveDoc(resumeDocs[0] || null);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "resume"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <FileText className="h-4 w-4" />
          Resume
          {resumeDocs.length > 0 && (
            <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
              {resumeDocs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setTab("cover_letter");
            setActiveDoc(coverLetterDocs[0] || null);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "cover_letter"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Mail className="h-4 w-4" />
          Cover Letter
          {coverLetterDocs.length > 0 && (
            <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
              {coverLetterDocs.length}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column: version list + generate button */}
          <div className="space-y-4 lg:col-span-1">
            <Button
              onClick={() => handleGenerate(tab)}
              disabled={generating}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generating
                ? "Generating..."
                : currentDocs.length === 0
                  ? `Generate ${tab === "resume" ? "Resume" : "Cover Letter"}`
                  : "Generate New Version"}
            </Button>

            {currentDocs.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Versions
                  </h3>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-gray-100">
                  {currentDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setActiveDoc(doc)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        activeDoc?.id === doc.id
                          ? "bg-brand-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            v{doc.version_number}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.created_at).toLocaleString()}
                          </p>
                        </div>
                        {doc.status === "saved" && (
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeDoc?.keyword_matches && (
              <KeywordPanel alignment={activeDoc.keyword_matches} />
            )}
          </div>

          {/* Right column: preview */}
          <div className="lg:col-span-2 space-y-4">
            {activeDoc ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">
                      {activeDoc.label} · {activeDoc.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {activeDoc.status !== "saved" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSaveVersion}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark as saved
                      </Button>
                    )}
                    <Button size="sm" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-1" />
                      Export HTML
                    </Button>
                  </div>
                </div>

                {tab === "resume" ? (
                  <ResumePreview
                    content={activeDoc.content as TailoredResumeContent}
                  />
                ) : (
                  <CoverLetterPreview
                    content={activeDoc.content as CoverLetterContent}
                  />
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-sm text-gray-500">
                    No {tab === "resume" ? "resume" : "cover letter"} versions yet.
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Click &ldquo;Generate&rdquo; to create your first version.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
