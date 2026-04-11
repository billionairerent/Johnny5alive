import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exportResumeToHTML,
  exportCoverLetterToHTML,
} from "@/lib/documents/export";
import type {
  TailoredResumeContent,
  CoverLetterContent,
} from "@/types/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("tailored_documents")
    .select("*")
    .eq("id", id)
    .single();

  if (!doc) {
    return new NextResponse("Document not found", { status: 404 });
  }

  let html: string;
  let filename: string;

  if (doc.doc_type === "resume") {
    html = exportResumeToHTML(doc.content as TailoredResumeContent);
    filename = `resume-v${doc.version_number || 1}.html`;
  } else if (doc.doc_type === "cover_letter") {
    html = exportCoverLetterToHTML(doc.content as CoverLetterContent);
    filename = `cover-letter-v${doc.version_number || 1}.html`;
  } else {
    return new NextResponse("Unsupported document type", { status: 400 });
  }

  // Mark as exported (best effort — don't block if it fails)
  try {
    await supabase
      .from("tailored_documents")
      .update({ status: "exported" })
      .eq("id", id);
  } catch {
    // ignore
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
