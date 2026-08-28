export type FieldStatus = "available" | "selected" | "confirmed" | "edited" | "rejected" | "needs_review";
export type DemoField = { key: string; label: string; value: string; source: string; verified: string; status: FieldStatus; imported?: boolean };
export type DemoDocument = { id: string; label: string; required: boolean; specification: string; fileName?: string; status: "missing" | "uploaded" | "invalid" | "prepared" | "valid"; prepared?: boolean };
export type DemoState = { fields: Record<string, DemoField>; documents: DemoDocument[]; conflict: { resolved: boolean; value?: string }; declarations: { truth: boolean; cancellation: boolean }; selectedPrevious: boolean; completion: boolean };

const source = "Uploaded Application Form";
const makeField = (key: string, label: string, value: string): DemoField => ({ key, label, value, source, verified: "", status: "available" });
export const initialDemoState = (): DemoState => ({
  fields: Object.fromEntries([
    makeField("fullName", "Full Name", ""), makeField("fatherName", "Father Name", ""), makeField("motherName", "Mother Name", ""), makeField("dob", "Date of Birth", ""), makeField("gender", "Gender", ""), makeField("mobile", "Mobile", ""), makeField("email", "Email", ""), makeField("permanentAddress", "Permanent Address", ""), makeField("district", "District", ""), makeField("taluka", "Taluka", ""), makeField("pin", "PIN", ""), makeField("graduation", "Graduation", ""), makeField("college", "College", ""), makeField("category", "Category", ""), makeField("experience", "Experience", "")
  ].map(field => [field.key, field])),
  documents: [
    { id: "photo", label: "Recent Photograph", required: true, specification: "JPG/JPEG, 200×230px, 20–50 KB", status: "missing" },
    { id: "signature", label: "Signature", required: true, specification: "JPG, 140×60px, 10–20 KB", fileName: "demo_signature.jpg", status: "valid" },
    { id: "identity", label: "Demo Identity Proof", required: true, specification: "PDF, max 5 MB", fileName: "demo_identity.pdf", status: "valid" },
    { id: "dobProof", label: "Date of Birth Proof", required: true, specification: "PDF, max 5 MB", fileName: "demo_birth_record.pdf", status: "valid" },
    { id: "education", label: "Education Certificate", required: true, specification: "PDF, max 5 MB", fileName: "demo_degree.pdf", status: "valid" },
    { id: "resume", label: "Resume", required: true, specification: "PDF, max 5 MB", fileName: "demo_resume.pdf", status: "valid" }
  ], conflict: { resolved: false }, declarations: { truth: false, cancellation: false }, selectedPrevious: false, completion: false
});

export function progressOf(state: DemoState) { const selected = Object.values(state.fields).filter(f => ["selected", "confirmed", "edited"].includes(f.status)).length; const docReady = state.documents.filter(d => d.status === "valid" || d.status === "prepared").length; const total = Object.keys(state.fields).length + state.documents.length + 3; return Math.round(((selected + docReady + Number(state.conflict.resolved) + Number(state.declarations.truth) + Number(state.declarations.cancellation)) / total) * 100); }
export function selectField(state: DemoState, key: string): DemoState { return { ...state, fields: { ...state.fields, [key]: { ...state.fields[key], status: "confirmed", imported: true } } }; }
export function rejectField(state: DemoState, key: string): DemoState { return { ...state, fields: { ...state.fields, [key]: { ...state.fields[key], status: "rejected", imported: false } } }; }
export function editField(state: DemoState, key: string, value: string): DemoState { return { ...state, fields: { ...state.fields, [key]: { ...state.fields[key], value, status: "edited", imported: true } } }; }
export function resolveConflict(state: DemoState, value: string): DemoState { return { ...state, conflict: { resolved: true, value }, fields: { ...state.fields, district: { ...state.fields.district, value, status: "confirmed", imported: value === "Nagpur" } } }; }
