import { NextRequest, NextResponse } from "next/server";

const FIELDS = [
  { id: "f-1", field_id: "full_name", key: "full_name", label: "Full Name", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-2", field_id: "father_name", key: "father_name", label: "Father Name", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-3", field_id: "mother_name", key: "mother_name", label: "Mother Name", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-4", field_id: "dob", key: "dob", label: "Date of Birth", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-5", field_id: "gender", key: "gender", label: "Gender", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-6", field_id: "mobile", key: "mobile", label: "Mobile", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-7", field_id: "email", key: "email", label: "Email", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-8", field_id: "permanent_address", key: "permanent_address", label: "Permanent Address", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-9", field_id: "district", key: "district", label: "District", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-10", field_id: "taluka", key: "taluka", label: "Taluka", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-11", field_id: "pin", key: "pin", label: "PIN", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-12", field_id: "tenth", key: "tenth", label: "10th Qualification", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-13", field_id: "twelfth", key: "twelfth", label: "12th Qualification", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-14", field_id: "graduation", key: "graduation", label: "Graduation", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-15", field_id: "college", key: "college", label: "College", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-16", field_id: "course", key: "course", label: "Course", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-17", field_id: "category", key: "category", label: "Category", value: "", source: "user_input", status: "available", last_verified: null },
  { id: "f-18", field_id: "experience", key: "experience", label: "Experience", value: "", source: "user_input", status: "available", last_verified: null }
];

const REQUIREMENTS = [
  { id: "req-photo", document_type: "photo", label: "Photograph", required: true, allowed_formats: ["jpg", "jpeg", "png", "webp"], max_size_kb: 50, min_size_kb: 20, required_width: 200, required_height: 230, description: "Recent photo" },
  { id: "req-sig", document_type: "signature", label: "Signature", required: true, allowed_formats: ["jpg", "jpeg", "png", "webp"], max_size_kb: 50, min_size_kb: 10, required_width: 140, required_height: 60, description: "Signature on white background" },
  { id: "req-id", document_type: "identity_proof", label: "Demo Identity Proof", required: true, allowed_formats: ["pdf"], max_size_kb: 1024, min_size_kb: null, required_width: null, required_height: null, description: "Identity Document" },
  { id: "req-dob", document_type: "dob_proof", label: "DOB Proof", required: true, allowed_formats: ["pdf"], max_size_kb: 1024, min_size_kb: null, required_width: null, required_height: null, description: "Birth Record" },
  { id: "req-edu", document_type: "education_certificate", label: "Education Certificate", required: true, allowed_formats: ["pdf"], max_size_kb: 1024, min_size_kb: null, required_width: null, required_height: null, description: "Degree Certificate" },
  { id: "req-res", document_type: "resume", label: "Resume", required: true, allowed_formats: ["pdf"], max_size_kb: 1024, min_size_kb: null, required_width: null, required_height: null, description: "Curriculum Vitae" }
];

const SECTIONS = [
  { slug: "personal", title: "Personal Details", description: "Synthetic personal details", required: true },
  { slug: "contact", title: "Contact Details", description: "Synthetic contact details", required: true },
  { slug: "address", title: "Address", description: "Synthetic address", required: true },
  { slug: "education", title: "Education", description: "Synthetic education", required: true },
  { slug: "experience", title: "Experience", description: "Synthetic experience", required: true },
  { slug: "eligibility", title: "Eligibility", description: "Synthetic eligibility", required: true }
];

// Mutable document store for demo session
let documentsStore: any[] = [
  { id: "doc-1", application_id: "demo-recruitment-2026", document_requirement_id: "req-photo", document_type: "photo", label: "Photograph", required: true, allowed_formats: ["jpg", "jpeg", "png", "webp"], max_size_kb: 50, required_width: 200, required_height: 230, status: "missing", document_id: null, validation_status: "pending", preparation_status: "not_required", file_name: null, original_filename: null, original_size: null, prepared_size: null, original_dimensions: null, prepared_dimensions: null, file_url: null, checks: [], photo_compliance: null, is_compressed: false, compression_ratio: 0, acknowledged: false },
  { id: "doc-2", application_id: "demo-recruitment-2026", document_requirement_id: "req-sig", document_type: "signature", label: "Signature", required: true, allowed_formats: ["jpg", "jpeg", "png", "webp"], max_size_kb: 50, required_width: 140, required_height: 60, status: "missing", document_id: null, validation_status: "pending", preparation_status: "not_required", file_name: null, original_filename: null, original_size: null, prepared_size: null, original_dimensions: null, prepared_dimensions: null, file_url: null, checks: [], photo_compliance: null, is_compressed: false, compression_ratio: 0, acknowledged: false }
];

const APPLICATION = {
  id: "demo-recruitment-2026",
  session_id: "demo-session-123",
  application_type_id: "demo-recruitment-2026",
  application_mode: "DEMO",
  status: "draft",
  progress: 0,
  created_at: "2026-08-28T00:00:00Z"
};

const SESSION = {
  id: "demo-session-123",
  status: "active",
  application: APPLICATION,
  applications: [APPLICATION],
  disclaimer: "Independent prototype. Vault-synced application."
};

async function handleRequest(req: NextRequest): Promise<NextResponse> {
  try {
    const pathname = req.nextUrl ? req.nextUrl.pathname : "/api";
    const slugPath = pathname.replace(/^\/api\/?/, "");
    const method = req.method.toUpperCase();

    // Session & App Routes
    if (slugPath === "sessions" || slugPath.startsWith("sessions/")) {
      return NextResponse.json(SESSION);
    }
    if (slugPath === "applications") {
      return NextResponse.json([APPLICATION]);
    }

    // Application specific document upload route
    if (slugPath.includes("/documents/upload")) {
      let requirementId = "req-photo";
      let originalFilename = "uploaded_photo.jpg";
      let originalSize = 385000;
      let dataUrl: string | null = null;

      try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const reqIdFromForm = formData.get("document_requirement_id") as string | null;
        if (reqIdFromForm) requirementId = reqIdFromForm;

        if (file && typeof file === "object" && file.name) {
          originalFilename = file.name;
          originalSize = file.size || originalSize;
          try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString("base64");
            const mime = file.type || (originalFilename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
            dataUrl = `data:${mime};base64,${base64}`;
          } catch {
            // fallback
          }
        }
      } catch {
        // fallback if form parsing fails
      }

      let docSlot = documentsStore.find((d) => d.document_requirement_id === requirementId);
      if (!docSlot) {
        docSlot = documentsStore[0];
      }

      const docTypeLower = (docSlot.document_type || "").toLowerCase();
      const isPhoto = docTypeLower === "photo" || docTypeLower === "photograph";
      const docId = `doc-${Date.now()}`;
      const reqWidth = docSlot.required_width || (isPhoto ? 200 : 140);
      const reqHeight = docSlot.required_height || (isPhoto ? 230 : 60);

      const targetMaxKb = docSlot.max_size_kb || 50;
      const targetMaxBytes = targetMaxKb * 1024;
      const preparedSize = Math.min(originalSize, targetMaxBytes - 2048);
      const reductionRatio = originalSize > preparedSize ? Math.round((1 - preparedSize / originalSize) * 1000) / 10 : 88.0;

      // Update in-memory document state
      docSlot.document_id = docId;
      docSlot.original_filename = originalFilename;
      docSlot.file_name = originalFilename;
      docSlot.original_size = originalSize > preparedSize ? originalSize : Math.round(preparedSize * 8.3);
      docSlot.prepared_size = preparedSize;
      docSlot.original_dimensions = `${reqWidth * 3}×${reqHeight * 3} px`;
      docSlot.prepared_dimensions = `${reqWidth}×${reqHeight} px`;
      docSlot.status = "valid";
      docSlot.validation_status = "valid";
      docSlot.preparation_status = "prepared";
      docSlot.is_compressed = true;
      docSlot.compression_ratio = reductionRatio;
      docSlot.compression_status = "compressed";
      docSlot.acknowledged = false;

      if (dataUrl) {
        docSlot.file_url = dataUrl;
      } else {
        const bgHex = isPhoto ? "%23e0e7ff" : "%23f3f4f6";
        const textHex = isPhoto ? "%233730a3" : "%231f2937";
        const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${reqWidth}" height="${reqHeight}" viewBox="0 0 ${reqWidth} ${reqHeight}"><rect width="100%" height="100%" fill="${bgHex}"/><text x="50%" y="45%" font-size="12" font-family="sans-serif" font-weight="bold" fill="${textHex}" dominant-baseline="middle" text-anchor="middle">${docSlot.label}</text><text x="50%" y="65%" font-size="10" font-family="sans-serif" fill="${textHex}" dominant-baseline="middle" text-anchor="middle">${reqWidth}x${reqHeight} px</text></svg>`;
        docSlot.file_url = `data:image/svg+xml;base64,${Buffer.from(svgStr).toString("base64")}`;
      }

      docSlot.checks = [
        { name: "Format", passed: true, actual: "JPEG/PNG", message: "Allowed image format" },
        { name: "File Size", passed: true, actual: `${Math.round(preparedSize / 1024)} KB`, message: `Compressed from ${Math.round(originalSize / 1024)} KB (Max ${targetMaxKb} KB)` },
        { name: "Dimensions", passed: true, actual: `${reqWidth}×${reqHeight} px`, message: `Resized to required ${reqWidth}×${reqHeight} px` }
      ];

      if (isPhoto) {
        docSlot.photo_compliance = {
          pass: true,
          score: 97,
          checks: [
            { name: "Face Visibility", status: "PASS", message: "Clear front-facing portrait detected" },
            { name: "Background", status: "PASS", message: "Light uniform background verified" },
            { name: "Sharpness & Contrast", status: "PASS", message: "Optimal exposure and focus" }
          ],
          requires_new_photo: false
        };
      }

      return NextResponse.json({
        document_id: docId,
        name: docSlot.label,
        document_type: docSlot.document_type,
        original_size: originalSize,
        validation_status: "valid",
        preparation_status: "prepared",
        checks: docSlot.checks
      });
    }

    if (slugPath.startsWith("applications")) {
      if (slugPath.endsWith("/requirements")) return NextResponse.json(REQUIREMENTS);
      if (slugPath.endsWith("/sections")) return NextResponse.json(SECTIONS);
      if (slugPath.endsWith("/fields")) return NextResponse.json(FIELDS);
      if (slugPath.endsWith("/progress")) {
        const readyCount = documentsStore.filter((d) => d.status === "valid" || d.preparation_status === "prepared").length;
        return NextResponse.json({ progress: readyCount === 2 ? 100 : 50, completed_fields: 18, total_fields: 18, missing_documents: [] });
      }
      if (slugPath.endsWith("/documents")) return NextResponse.json(documentsStore);
      if (slugPath.endsWith("/validation")) return NextResponse.json({ valid: true, messages: [] });
      if (slugPath.endsWith("/imports")) return NextResponse.json([]);
      if (slugPath.endsWith("/conflicts")) return NextResponse.json([]);
      if (slugPath.endsWith("/smart-import") || slugPath.endsWith("/auto-fetch")) {
        return NextResponse.json({ status: "success", imported_count: 0, fields: FIELDS });
      }
      if (slugPath.endsWith("/clear-fields")) return NextResponse.json({ status: "cleared", field_count: 0 });
      if (slugPath.endsWith("/declaration")) return NextResponse.json({ accepted: true });
      if (slugPath.endsWith("/complete-demo")) {
        return NextResponse.json({ status: "completed", message: "Application submitted successfully!", external_submission: false });
      }
      return NextResponse.json(APPLICATION);
    }

    if (slugPath.startsWith("previous-applications")) {
      return NextResponse.json([]);
    }

    // Document management endpoints
    if (slugPath === "documents" || slugPath.startsWith("documents/")) {
      // Photo Analysis
      if (slugPath.endsWith("/photo-analysis")) {
        return NextResponse.json({
          pass: true,
          score: 97,
          checks: [
            { name: "Face Visibility", status: "PASS", message: "Centered front portrait detected" },
            { name: "Background", status: "PASS", message: "Uniform light background confirmed" },
            { name: "Lighting & Sharpness", status: "PASS", message: "Passed quality specs" }
          ],
          requires_new_photo: false
        });
      }

      // Signature Analysis
      if (slugPath.endsWith("/signature-analysis")) {
        return NextResponse.json({
          pass: true,
          score: 95,
          checks: [
            { name: "Ink Contrast", status: "PASS", message: "Dark legible signature verified" },
            { name: "Background", status: "PASS", message: "Clean white background verified" }
          ],
          requires_new_signature: false
        });
      }

      // Prepare Document
      if (slugPath.endsWith("/prepare")) {
        const parts = slugPath.split("/");
        const docId = parts[1];
        const docSlot = documentsStore.find((d) => d.document_id === docId || d.id === docId) || documentsStore[0];
        
        docSlot.status = "valid";
        docSlot.validation_status = "valid";
        docSlot.preparation_status = "prepared";
        docSlot.is_compressed = true;
        if (!docSlot.prepared_size && docSlot.original_size) {
          docSlot.prepared_size = Math.round(docSlot.original_size * 0.15);
          docSlot.compression_ratio = 85.0;
        }

        return NextResponse.json({
          document_id: docSlot.document_id || docId,
          status: "SUCCESS",
          original_size: docSlot.original_size || 385000,
          prepared_size: docSlot.prepared_size || 38500,
          original_dimensions: docSlot.original_dimensions || "600×690 px",
          prepared_dimensions: docSlot.prepared_dimensions || "200×230 px",
          quality: 85,
          is_valid: true,
          is_compressed: true,
          compression_ratio: docSlot.compression_ratio || 85.0,
          compression_status: "compressed",
          acknowledged: docSlot.acknowledged || false
        });
      }

      // Acknowledge Compression
      if (slugPath.endsWith("/acknowledge-compression")) {
        const parts = slugPath.split("/");
        const docId = parts[1];
        const docSlot = documentsStore.find((d) => d.document_id === docId || d.id === docId);
        if (docSlot) docSlot.acknowledged = true;

        return NextResponse.json({
          document_id: docId,
          acknowledged: true,
          message: "Compression & resizing acknowledged."
        });
      }

      // Delete/Remove Document
      if (method === "DELETE" || slugPath.includes("delete")) {
        const parts = slugPath.split("/");
        const docId = parts[1] || parts[0];
        const docSlot = documentsStore.find((d) => d.document_id === docId || d.id === docId);
        if (docSlot) {
          docSlot.status = "missing";
          docSlot.document_id = null;
          docSlot.original_filename = null;
          docSlot.file_name = null;
          docSlot.original_size = null;
          docSlot.prepared_size = null;
          docSlot.original_dimensions = null;
          docSlot.prepared_dimensions = null;
          docSlot.file_url = null;
          docSlot.checks = [];
          docSlot.photo_compliance = null;
          docSlot.is_compressed = false;
          docSlot.compression_ratio = 0;
          docSlot.acknowledged = false;
        }
        return NextResponse.json({
          document_id: docId,
          status: "removed",
          message: "Document successfully removed."
        });
      }

      return NextResponse.json(documentsStore);
    }

    if (slugPath.startsWith("conflicts/")) {
      return NextResponse.json({ id: "conflict-1", status: "resolved", resolved_value: "" });
    }
    if (slugPath.startsWith("imports/")) {
      return NextResponse.json({ id: "imp-1", decision: "use", value: "" });
    }
    if (slugPath === "health" || slugPath === "") {
      return NextResponse.json({ status: "ok", service: "formsetu-api", demo_only: true });
    }

    return NextResponse.json(APPLICATION);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request);
}

