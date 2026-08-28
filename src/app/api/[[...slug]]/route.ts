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

const DOCUMENTS = [
  { id: "doc-1", application_id: "demo-recruitment-2026", document_requirement_id: "req-photo", document_type: "photo", label: "Photograph", status: "missing", file_name: null, file_path: null, file_size_kb: null, mime_type: null, width: null, height: null, validation_status: "pending", preparation_status: "not_required", error_message: null, metadata_json: {}, uploaded_at: null },
  { id: "doc-2", application_id: "demo-recruitment-2026", document_requirement_id: "req-sig", document_type: "signature", label: "Signature", status: "missing", file_name: null, file_path: null, file_size_kb: null, mime_type: null, width: null, height: null, validation_status: "pending", preparation_status: "not_required", error_message: null, metadata_json: {}, uploaded_at: null }
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

function handleRequest(req: NextRequest): NextResponse {
  try {
    const pathname = req.nextUrl ? req.nextUrl.pathname : "/api";
    const slugPath = pathname.replace(/^\/api\/?/, "");

    if (slugPath === "sessions" || slugPath.startsWith("sessions/")) {
      return NextResponse.json(SESSION);
    }
    if (slugPath === "applications") {
      return NextResponse.json([APPLICATION]);
    }
    if (slugPath.startsWith("applications")) {
      if (slugPath.endsWith("/requirements")) return NextResponse.json(REQUIREMENTS);
      if (slugPath.endsWith("/sections")) return NextResponse.json(SECTIONS);
      if (slugPath.endsWith("/fields")) return NextResponse.json(FIELDS);
      if (slugPath.endsWith("/progress")) return NextResponse.json({ progress: 0, completed_fields: 0, total_fields: 18, missing_documents: [] });
      if (slugPath.endsWith("/documents")) return NextResponse.json(DOCUMENTS);
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
    if (slugPath === "documents" || slugPath.startsWith("documents/")) {
      if (slugPath.endsWith("/photo-analysis")) return NextResponse.json({ pass: true, score: 98, checks: [] });
      if (slugPath.endsWith("/signature-analysis")) return NextResponse.json({ pass: true, score: 95, checks: [] });
      return NextResponse.json(DOCUMENTS);
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
  } catch {
    return NextResponse.json(APPLICATION);
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
