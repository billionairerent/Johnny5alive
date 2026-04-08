import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ACCEPTED_RESUME_TYPES,
  MAX_RESUME_SIZE_BYTES,
} from "@/lib/constants";

function isDemoMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === "https://your-project.supabase.co"
  );
}

export async function POST(request: Request) {
  // In demo mode, resume uploads are handled client-side.
  if (isDemoMode()) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    // Return a fake success — the client-side demo store handles persistence.
    return NextResponse.json(
      {
        resume: {
          id: crypto.randomUUID(),
          name: file.name,
          is_master: false,
          file_path: `demo/${file.name}`,
          file_type: file.type,
          file_size: file.size,
          created_at: new Date().toISOString(),
        },
        demo: true,
      },
      { status: 201 }
    );
  }

  const supabase = await createClient();

  // Verify auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ACCEPTED_RESUME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Upload a PDF or Word document." },
      { status: 400 }
    );
  }

  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File exceeds maximum size." },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${user.id}/${timestamp}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload failed:", uploadError);
    return NextResponse.json(
      { error: "Failed to upload file." },
      { status: 500 }
    );
  }

  // Check if user has any existing resumes (first upload becomes master)
  const { count } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isMaster = (count ?? 0) === 0;

  // Create resume record
  const { data: resume, error: insertError } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      name: file.name,
      is_master: isMaster,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Resume record insert failed:", insertError);
    return NextResponse.json(
      { error: "Failed to save resume record." },
      { status: 500 }
    );
  }

  // Log the upload
  await supabase.from("logs").insert({
    user_id: user.id,
    category: "import",
    level: "info",
    message: `Resume uploaded: ${file.name}`,
    metadata: { resume_id: resume.id, file_path: filePath },
  });

  return NextResponse.json({ resume }, { status: 201 });
}
